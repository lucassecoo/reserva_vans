// ==================== ESTADO GLOBAL ====================
let currentStep = 1;
const totalSteps = 4;
let formData = {
  contratante: {},
  itinerario: { paradas: [] },
  passageiros: [],
};

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";
const API_RESERVAS_ROUTE = "/api/enviar/";

// Converte o estado do formulário para o formato esperado pelo backend Django
function buildPayloadForDjango(data) {
  const contratante = data.contratante || {};
  const itinerario = data.itinerario || {};
  const origem = itinerario.saida || {};
  const destino = itinerario.chegada || {};
  const retorno = itinerario.retorno || {};

  // Paradas: coletar via função existente
  const paradasRaw = collectParadas();
  const paradas = paradasRaw.map((p) => ({
    cep_parada: p.endereco.cep || "",
    rua_parada: p.endereco.rua || "",
    numero_rua_parada: p.endereco.numero || "",
    complemento_parada: p.endereco.complemento || null,
    cidade_parada: p.endereco.cidade || "",
    uf_parada: p.endereco.estado || "",
    bairro_parada: p.endereco.bairro || "",
    horario_parada: p.horario || null,
  }));

  // Passageiros
  const passageirosRaw = data.passageiros || [];
  const passageiros = passageirosRaw.map((p) => ({
    nome_passageiro: p.nome || "",
    idade_passageiro: p.idade || 0,
    rg_passageiro: p.rg || "",
    orgao_emissor_passageiro: p.orgao_expeditor || "",
  }));

  // Contratante (telefone não presente no formulário atual — enviar vazio)
  const contratantePayload = {
    motivacao_viagem: contratante.motivacao || "",
    nome_contratante: contratante.nome || "",
    rg_contratante: contratante.rg || null,
    telefone_contratante: contratante.telefone || "",
    orgao_emissor_contratante: contratante.orgao_expeditor || "",
    cpf_cnpj_contratante: contratante.cpf_cnpj || "",
    cep_contratante: contratante.endereco ? contratante.endereco.cep || "" : "",
    rua_contratante: contratante.endereco ? contratante.endereco.rua || "" : "",
    numero_rua_contratante: contratante.endereco
      ? contratante.endereco.numero || ""
      : "",
    complemento_contratante: contratante.inscricao_estadual || null,
    bairro_contratante: contratante.endereco
      ? contratante.endereco.bairro || ""
      : "",
    cidade_contratante: contratante.endereco
      ? contratante.endereco.cidade || ""
      : "",
    estado_contratante: contratante.endereco
      ? contratante.endereco.estado || ""
      : "",
  };

  const origemPayload = {
    cep_origem: origem.endereco ? origem.endereco.cep || "" : "",
    rua_origem: origem.endereco ? origem.endereco.rua || "" : "",
    numero_rua_origem: origem.endereco ? origem.endereco.numero || "" : "",
    complemento_origem: origem.endereco
      ? origem.endereco.complemento || null
      : null,
    cidade_origem: origem.endereco ? origem.endereco.cidade || "" : "",
    estado_origem: origem.endereco ? origem.endereco.estado || "" : "",
    bairro_origem: origem.endereco ? origem.endereco.bairro || "" : "",
    data_saida: origem.data || null,
    horario_saida: origem.horario || null,
  };

  const destinoPayload = {
    cep_destino: destino.endereco ? destino.endereco.cep || "" : "",
    rua_destino: destino.endereco ? destino.endereco.rua || "" : "",
    numero_rua_destino: destino.endereco ? destino.endereco.numero || "" : "",
    complemento_destino: destino.endereco
      ? destino.endereco.complemento || null
      : null,
    cidade_destino: destino.endereco ? destino.endereco.cidade || "" : "",
    estado_destino: destino.endereco ? destino.endereco.estado || "" : "",
    bairro_destino: destino.endereco ? destino.endereco.bairro || "" : "",
  };

  const retornoPayload =
    retorno && (retorno.data || retorno.horario)
      ? {
          data_retorno: retorno.data || null,
          horario_retorno: retorno.horario || null,
        }
      : null;

  // Dados de Aeroporto
  let dadosAeroportoPayload = null;
  const motivacao = contratante.motivacao || "";
  if (motivacao === "Aeroporto") {
    const numeroVoo = document.getElementById("numeroVoo").value.trim();
    const horarioChegada = document
      .getElementById("horarioChegada")
      .value.trim();
    const quantidadeMalas = document
      .getElementById("quantidadeMalas")
      .value.trim();

    dadosAeroportoPayload = {
      dados_voo: numeroVoo || "",
      horario_chegada_voo: horarioChegada || null,
      quantidade_malas: quantidadeMalas ? parseInt(quantidadeMalas) : null,
    };
  }

  return {
    contratante: contratantePayload,
    origem: origemPayload,
    destino: destinoPayload,
    retorno: retornoPayload,
    dados_aeroporto: dadosAeroportoPayload,
    paradas: paradas,
    passageiros: passageiros,
  };
}

// Contador de paradas e passageiros
let paradaCount = 0;
let passageiroCount = 0;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  initializeForm();
  loadDraft();
  setupEventListeners();
  focusFirstInput();
});

// ==================== SETUP DE EVENT LISTENERS ====================
function setupEventListeners() {
  // Navegação
  document.getElementById("nextBtn").addEventListener("click", nextStep);
  document.getElementById("prevBtn").addEventListener("click", prevStep);
  document.getElementById("submitBtn").addEventListener("click", submitForm);

  // Step 1: Contratante
  document
    .getElementById("motivacao")
    .addEventListener("change", handleMotivacaoChange);
  const cpfInput = document.getElementById("cpf");
  if (cpfInput) cpfInput.addEventListener("input", handleCpfCnpjInput);
  const cnpjInput = document.getElementById("cnpj");
  if (cnpjInput) cnpjInput.addEventListener("input", handleCpfCnpjInput);
  const isPJEl = document.getElementById("isPJ");
  if (isPJEl) {
    isPJEl.addEventListener("change", handleIsPJChange);
  }
  document
    .getElementById("buscarCepContratante")
    .addEventListener("click", () => buscarCep("Contratante"));

  // Step 2: Itinerário
  document
    .getElementById("buscarCepSaida")
    .addEventListener("click", () => buscarCep("Saida"));
  document
    .getElementById("buscarCepChegada")
    .addEventListener("click", () => buscarCep("Chegada"));
  document.querySelectorAll('input[name="temParadas"]').forEach((radio) => {
    radio.addEventListener("change", handleParadasChange);
  });
  document.getElementById("addParada").addEventListener("click", addParada);
  document
    .getElementById("dataSaida")
    .addEventListener("change", validateDates);
  document
    .getElementById("dataRetorno")
    .addEventListener("change", validateDates);

  // Step 3: Passageiros
  document
    .getElementById("addPassageiro")
    .addEventListener("click", addPassageiro);

  // Máscaras de input
  setupMasks();
}

// ==================== MÁSCARAS DE INPUT ====================
function setupMasks() {
  // CEP
  document.querySelectorAll('[id^="cep"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 8) value = value.slice(0, 8);
      e.target.value = value.replace(/(\d{5})(\d)/, "$1-$2");
    });
  });

  // RG
  document
    .querySelectorAll('[id$="rgContratante"], [id^="rgPassageiro"]')
    .forEach((input) => {
      input.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 9) value = value.slice(0, 9);
        e.target.value = value.replace(
          /(\d{2})(\d{3})(\d{3})(\d)/,
          "$1.$2.$3-$4"
        );
      });
    });

  // Estado (UF) - apenas letras maiúsculas
  document
    .querySelectorAll('[id$="estado"], [id$="Estado"]')
    .forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
      });
    });

  // Telefone - DDD separado
  const telefoneDdd = document.getElementById("telefoneDdd");
  if (telefoneDdd) {
    telefoneDdd.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 2) v = v.slice(0, 2);
      e.target.value = v;
    });
  }

  const telefoneInput = document.getElementById("telefoneContratante");
  if (telefoneInput) {
    telefoneInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 9) v = v.slice(0, 9);
      if (v.length <= 8) {
        v = v.replace(/(\d{4})(\d{0,4})/, "$1-$2");
      } else {
        v = v.replace(/(\d{5})(\d{0,4})/, "$1-$2");
      }
      e.target.value = v;
    });
  }

  // Horário (HH:MM) inputs - permitir digitar e inserir ':' automaticamente
  const horarioInputs = [];
  const hs = document.getElementById("horarioSaida");
  if (hs) horarioInputs.push(hs);
  const hr = document.getElementById("horarioRetorno");
  if (hr) horarioInputs.push(hr);
  const hc = document.getElementById("horarioChegada");
  if (hc) horarioInputs.push(hc);
  document
    .querySelectorAll('[id$="-horario"]')
    .forEach((el) => horarioInputs.push(el));

  horarioInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) {
        v = v.slice(0, 2) + ":" + v.slice(2);
      }
      e.target.value = v;
    });
  });

  // Número do voo - permitir letras e números
  const numeroVoo = document.getElementById("numeroVoo");
  if (numeroVoo) {
    numeroVoo.addEventListener("input", (e) => {
      let v = e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
      e.target.value = v;
    });
  }

  // Quantidade de malas - apenas números
  const quantidadeMalas = document.getElementById("quantidadeMalas");
  if (quantidadeMalas) {
    quantidadeMalas.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "");
      e.target.value = v;
    });
  }
}

// Máscara dinâmica CPF/CNPJ
function handleCpfCnpjInput(e) {
  let value = e.target.value.replace(/\D/g, "");

  // CPF: 11 dígitos
  if (value.length <= 11) {
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    // Esconder inscrição estadual para CPF
    document
      .getElementById("inscricaoEstadualContainer")
      .classList.add("hidden");
  }
  // CNPJ: 14 dígitos
  else {
    if (value.length > 14) value = value.slice(0, 14);
    value = value.replace(/(\d{2})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1/$2");
    value = value.replace(/(\d{4})(\d{1,2})$/, "$1-$2");

    // Mostrar inscrição estadual para CNPJ
    document
      .getElementById("inscricaoEstadualContainer")
      .classList.remove("hidden");
  }

  e.target.value = value;
}

// ==================== FUNÇÕES DE NAVEGAÇÃO ====================
function nextStep() {
  if (validateCurrentStep()) {
    saveStepData();
    currentStep++;
    updateStepDisplay();
    focusFirstInput();
    saveDraft(); // Auto-save
  } else {
    console.warn("nextStep blocked: validation failed");
    showToast(
      "Existem erros no formulário — verifique os campos em vermelho",
      true
    );
  }
}

function prevStep() {
  saveStepData();
  currentStep--;
  updateStepDisplay();
  focusFirstInput();
}

function updateStepDisplay() {
  // Esconder todos os steps
  document.querySelectorAll(".step-content").forEach((step) => {
    step.classList.add("hidden");
  });

  // Mostrar step atual
  document.getElementById(`step${currentStep}`).classList.remove("hidden");

  // Atualizar progress bar
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById("progressBar").style.width = `${progress}%`;
  document.getElementById("currentStep").textContent = currentStep;

  // Atualizar título do step
  const stepTitles = [
    "Informações do contratante",
    "Detalhes do itinerário",
    "Lista de passageiros",
    "Revisão e envio",
  ];
  document.getElementById("stepTitle").textContent =
    stepTitles[currentStep - 1];

  // Atualizar botões
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (currentStep === 1) {
    prevBtn.classList.add("hidden");
  } else {
    prevBtn.classList.remove("hidden");
  }

  if (currentStep === totalSteps) {
    nextBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    renderReview();
  } else {
    nextBtn.classList.remove("hidden");
    submitBtn.classList.add("hidden");
  }
}

// ==================== VALIDAÇÃO ====================
function validateCurrentStep() {
  clearErrors();
  let isValid = true;

  switch (currentStep) {
    case 1:
      isValid = validateStep1();
      break;
    case 2:
      isValid = validateStep2();
      break;
    case 3:
      isValid = validateStep3();
      break;
  }

  return isValid;
}

function validateStep1() {
  let isValid = true;

  // Log diagnóstico rápido
  console.log("validateStep1 start", {
    motivacao: (document.getElementById("motivacao") || { value: null }).value,
    isPJ: (document.getElementById("isPJ") || { checked: null }).checked,
    cpf: (document.getElementById("cpf") || { value: null }).value,
    cnpj: (document.getElementById("cnpj") || { value: null }).value,
    ddd: (document.getElementById("telefoneDdd") || { value: null }).value,
    telefone: (
      document.getElementById("telefoneContratante") || { value: null }
    ).value,
    cepContra: (document.getElementById("cepContratante") || { value: null })
      .value,
  });

  // Motivação
  const motivacao = document.getElementById("motivacao").value;
  if (!motivacao) {
    showError("motivacao", "Selecione a motivação da viagem");
    isValid = false;
  } else if (motivacao === "Outro") {
    const motivacaoOutro = document
      .getElementById("motivacaoOutro")
      .value.trim();
    if (!motivacaoOutro) {
      showError("motivacaoOutro", "Especifique a motivação");
      isValid = false;
    }
  }

  // Nome / Razão e documentos dependendo de PJ/PF
  const isPJ = document.getElementById("isPJ").checked;

  if (isPJ) {
    const razao = document.getElementById("razaoSocial").value.trim();
    if (!razao) {
      showError("razaoSocial", "Razão social é obrigatória");
      isValid = false;
    }
  } else {
    const nome = document.getElementById("nomeContratante").value.trim();
    if (!nome) {
      showError("nomeContratante", "Nome é obrigatório");
      isValid = false;
    }

    const rg = document.getElementById("rgContratante").value.trim();
    if (!rg) {
      showError("rgContratante", "RG é obrigatório");
      isValid = false;
    }

    const orgao = document.getElementById("orgaoExpedidor").value.trim();
    if (!orgao) {
      showError("orgaoExpedidor", "Órgão expedidor é obrigatório");
      isValid = false;
    }
  }

  // CPF/CNPJ
  if (isPJ) {
    const cnpj = (
      document.getElementById("cnpj") || { value: "" }
    ).value.replace(/\D/g, "");
    if (!cnpj) {
      showError("cnpj", "CNPJ é obrigatório");
      isValid = false;
    } else if (cnpj.length !== 14 || !validarCNPJ(cnpj)) {
      showError("cnpj", "CNPJ inválido");
      isValid = false;
    }
  } else {
    const cpf = (document.getElementById("cpf") || { value: "" }).value.replace(
      /\D/g,
      ""
    );
    if (!cpf) {
      showError("cpf", "CPF é obrigatório");
      isValid = false;
    } else if (cpf.length !== 11 || !validarCPF(cpf)) {
      showError("cpf", "CPF inválido");
      isValid = false;
    }
  }

  // Telefone e DDD obrigatórios para ambos
  const ddd = document.getElementById("telefoneDdd").value.replace(/\D/g, "");
  const telefoneNum = document
    .getElementById("telefoneContratante")
    .value.replace(/\D/g, "");

  if (!ddd || ddd.length !== 2) {
    showError("telefoneDdd", "DDD inválido");
    isValid = false;
  }
  if (!telefoneNum || telefoneNum.length < 8 || telefoneNum.length > 9) {
    showError("telefoneContratante", "Telefone inválido");
    isValid = false;
  }

  // Endereço
  const enderecoFields = ["cep", "rua", "numero", "bairro", "cidade", "estado"];
  enderecoFields.forEach((field) => {
    const value = document.getElementById(`${field}Contratante`).value.trim();
    if (!value) {
      showError(`${field}Contratante`, `${field.toUpperCase()} é obrigatório`);
      isValid = false;
    }
  });

  // Validar UF (2 letras)
  const uf = document.getElementById("estadoContratante").value.trim();
  if (uf && uf.length !== 2) {
    showError("estadoContratante", "UF deve ter 2 letras");
    isValid = false;
  }

  // Inscrição estadual obrigatória para PJ
  if (isPJ) {
    const inscricaoEstadual = document
      .getElementById("inscricaoEstadual")
      .value.trim();
    if (!inscricaoEstadual) {
      showError(
        "inscricaoEstadual",
        "Inscrição estadual é obrigatória para PJ"
      );
      isValid = false;
    }
  }

  return isValid;
}

function validateStep2() {
  let isValid = true;

  // Endereço de saída
  const saidaFields = [
    "cepSaida",
    "ruaSaida",
    "numeroSaida",
    "bairroSaida",
    "cidadeSaida",
    "estadoSaida",
  ];
  saidaFields.forEach((field) => {
    const value = document.getElementById(field).value.trim();
    if (!value) {
      showError(field, "Campo obrigatório");
      isValid = false;
    }
  });

  // Data e hora de saída
  const dataSaida = document.getElementById("dataSaida").value;
  const horarioSaida = document.getElementById("horarioSaida").value.trim();
  const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!dataSaida) {
    showError("dataSaida", "Data de saída é obrigatória");
    isValid = false;
  }
  if (!horarioSaida) {
    showError("horarioSaida", "Horário de saída é obrigatório");
    isValid = false;
  } else if (!horarioRegex.test(horarioSaida)) {
    showError("horarioSaida", "Horário inválido (HH:MM)");
    isValid = false;
  }

  // Horário de retorno e checagens relacionadas
  const dataRetorno = document.getElementById("dataRetorno").value;
  const horarioRetorno = document.getElementById("horarioRetorno").value.trim();

  // Se houver data de retorno, horário é obrigatório e precisa ser válido
  if (dataRetorno) {
    if (!horarioRetorno) {
      showError(
        "horarioRetorno",
        "Horário de retorno é obrigatório quando há data de retorno"
      );
      isValid = false;
    } else if (!horarioRegex.test(horarioRetorno)) {
      showError("horarioRetorno", "Horário de retorno inválido (HH:MM)");
      isValid = false;
    }
  } else {
    // Se não houver data, validar formato se preenchido
    if (horarioRetorno && !horarioRegex.test(horarioRetorno)) {
      showError("horarioRetorno", "Horário de retorno inválido (HH:MM)");
      isValid = false;
    }
  }

  // Endereço de chegada
  const chegadaFields = [
    "cepChegada",
    "ruaChegada",
    "numeroChegada",
    "bairroChegada",
    "cidadeChegada",
    "estadoChegada",
  ];
  chegadaFields.forEach((field) => {
    const value = document.getElementById(field).value.trim();
    if (!value) {
      showError(field, "Campo obrigatório");
      isValid = false;
    }
  });

  // Origem e destino não podem ser o mesmo local (comparação por CEP quando disponível, senão por endereço completo)
  const cepSaida = document.getElementById("cepSaida").value.trim();
  const cepChegada = document.getElementById("cepChegada").value.trim();

  const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

  let samePlace = false;
  if (cepSaida && cepChegada && cepSaida === cepChegada) {
    samePlace = true;
  } else {
    const origemStr = [
      normalize(document.getElementById("ruaSaida").value),
      normalize(document.getElementById("numeroSaida").value),
      normalize(document.getElementById("cidadeSaida").value),
      normalize(document.getElementById("estadoSaida").value),
    ].join("|");
    const destinoStr = [
      normalize(document.getElementById("ruaChegada").value),
      normalize(document.getElementById("numeroChegada").value),
      normalize(document.getElementById("cidadeChegada").value),
      normalize(document.getElementById("estadoChegada").value),
    ].join("|");

    if (origemStr && destinoStr && origemStr === destinoStr) {
      samePlace = true;
    }
  }

  if (samePlace) {
    showError("cepSaida", "Origem e destino não podem ser o mesmo local");
    showError("cepChegada", "Origem e destino não podem ser o mesmo local");
    isValid = false;
  }

  // Se ambas datas e horários estiverem preenchidos, garantir que retorno não seja anterior à saída
  if (dataSaida && horarioSaida && dataRetorno && horarioRetorno) {
    try {
      const dtSaida = new Date(`${dataSaida}T${horarioSaida}:00`);
      const dtRetorno = new Date(`${dataRetorno}T${horarioRetorno}:00`);
      if (dtRetorno < dtSaida) {
        showError(
          "dataRetorno",
          "Data/hora de retorno não pode ser anterior à saída"
        );
        showError(
          "horarioRetorno",
          "Horário de retorno não pode ser anterior à saída"
        );
        isValid = false;
      }
    } catch (e) {
      // Em caso de datas inválidas, deixar as validações individuais cobrirem
    }
  } else if (dataRetorno && dataSaida && !horarioRetorno) {
    // Se data de retorno preenchida mas horário não válido/ausente, já foi tratado acima
  }

  // Validações de Aeroporto (apenas se motivação for "Aeroporto")
  const motivacao = document.getElementById("motivacao").value;
  if (motivacao === "Aeroporto") {
    // Número do voo
    const numeroVoo = document.getElementById("numeroVoo").value.trim();
    if (!numeroVoo) {
      showError("numeroVoo", "Número do voo é obrigatório");
      isValid = false;
    }

    // Horário de chegada
    const horarioChegada = document
      .getElementById("horarioChegada")
      .value.trim();
    if (!horarioChegada) {
      showError("horarioChegada", "Horário de chegada é obrigatório");
      isValid = false;
    } else if (!horarioRegex.test(horarioChegada)) {
      showError("horarioChegada", "Horário inválido (HH:MM)");
      isValid = false;
    }

    // Quantidade de malas
    const quantidadeMalas = document
      .getElementById("quantidadeMalas")
      .value.trim();
    if (quantidadeMalas === "") {
      showError("quantidadeMalas", "Quantidade de malas é obrigatória");
      isValid = false;
    } else if (isNaN(quantidadeMalas) || parseInt(quantidadeMalas) < 0) {
      showError("quantidadeMalas", "Quantidade de malas inválida");
      isValid = false;
    }
  }

  return isValid;
}

function validateStep3() {
  // Garantir que o array de passageiros esteja sincronizado com o DOM
  collectPassageiros();
  if (formData.passageiros.length === 0) {
    showError("passageiros", "Adicione pelo menos 1 passageiro");
    return false;
  }
  return true;
}

// Validação de datas
function validateDates() {
  const dataSaida = document.getElementById("dataSaida").value;
  const dataRetorno = document.getElementById("dataRetorno").value;

  if (dataSaida && dataRetorno && dataRetorno < dataSaida) {
    showError(
      "dataRetorno",
      "Data de retorno não pode ser anterior à data de saída"
    );
    return false;
  }

  clearError("dataRetorno");
  return true;
}

// Validar CPF (algoritmo oficial)
function validarCPF(cpf) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Validar CNPJ (algoritmo oficial)
function validarCNPJ(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;

  return true;
}

// ==================== EXIBIÇÃO DE ERROS ====================
function showError(fieldId, message) {
  const errorElement = document.getElementById(`error-${fieldId}`);
  const inputElement = document.getElementById(fieldId);

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
    errorElement.setAttribute("role", "alert");
  }

  if (inputElement) {
    inputElement.classList.add("border-red-500");
    inputElement.setAttribute("aria-invalid", "true");
  }
}

function clearError(fieldId) {
  const errorElement = document.getElementById(`error-${fieldId}`);
  const inputElement = document.getElementById(fieldId);

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.style.display = "none";
    errorElement.removeAttribute("role");
  }

  if (inputElement) {
    inputElement.classList.remove("border-red-500");
    inputElement.removeAttribute("aria-invalid");
  }
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
    el.removeAttribute("role");
  });

  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.classList.remove("border-red-500");
    el.removeAttribute("aria-invalid");
  });
}

// ==================== SALVAR DADOS DO STEP ====================
function saveStepData() {
  switch (currentStep) {
    case 1:
      saveStep1Data();
      break;
    case 2:
      saveStep2Data();
      break;
    case 3:
      // Passageiros já salvos em tempo real
      break;
  }
}

function saveStep1Data() {
  const motivacao = document.getElementById("motivacao").value;
  const isPJ = document.getElementById("isPJ").checked;

  formData.contratante = {
    isPJ: isPJ,
    motivacao:
      motivacao === "Outro"
        ? document.getElementById("motivacaoOutro").value.trim()
        : motivacao,
    nome: isPJ
      ? document.getElementById("razaoSocial").value.trim()
      : document.getElementById("nomeContratante").value.trim(),
    rg: isPJ ? null : document.getElementById("rgContratante").value.trim(),
    orgao_expeditor: isPJ
      ? ""
      : document.getElementById("orgaoExpedidor").value.trim(),
    cpf_cnpj: isPJ
      ? document.getElementById("cnpj").value.trim()
      : document.getElementById("cpf").value.trim(),
    telefone: (function () {
      const ddd = document.getElementById("telefoneDdd").value.trim();
      const tel = document.getElementById("telefoneContratante").value.trim();
      return ddd && tel ? `(${ddd}) ${tel}` : tel || "";
    })(),
    inscricao_estadual:
      document.getElementById("inscricaoEstadual").value.trim() || null,
    endereco: {
      cep: document.getElementById("cepContratante").value.trim(),
      rua: document.getElementById("ruaContratante").value.trim(),
      numero: document.getElementById("numeroContratante").value.trim(),
      complemento:
        document.getElementById("complementoContratante").value.trim() || null,
      bairro: document.getElementById("bairroContratante").value.trim(),
      cidade: document.getElementById("cidadeContratante").value.trim(),
      estado: document.getElementById("estadoContratante").value.trim(),
    },
  };
}

function saveStep2Data() {
  formData.itinerario = {
    saida: {
      endereco: {
        cep: document.getElementById("cepSaida").value.trim(),
        rua: document.getElementById("ruaSaida").value.trim(),
        numero: document.getElementById("numeroSaida").value.trim(),
        complemento:
          document.getElementById("complementoSaida").value.trim() || null,
        bairro: document.getElementById("bairroSaida").value.trim(),
        cidade: document.getElementById("cidadeSaida").value.trim(),
        estado: document.getElementById("estadoSaida").value.trim(),
      },
      data: document.getElementById("dataSaida").value,
      horario: document.getElementById("horarioSaida").value,
    },
    chegada: {
      endereco: {
        cep: document.getElementById("cepChegada").value.trim(),
        rua: document.getElementById("ruaChegada").value.trim(),
        numero: document.getElementById("numeroChegada").value.trim(),
        complemento:
          document.getElementById("complementoChegada").value.trim() || null,
        bairro: document.getElementById("bairroChegada").value.trim(),
        cidade: document.getElementById("cidadeChegada").value.trim(),
        estado: document.getElementById("estadoChegada").value.trim(),
      },
    },
    retorno: {
      data: document.getElementById("dataRetorno").value || null,
      horario: document.getElementById("horarioRetorno").value || null,
    },
    aeroporto: {
      numeroVoo: document.getElementById("numeroVoo").value.trim() || null,
      horarioChegada:
        document.getElementById("horarioChegada").value.trim() || null,
      quantidadeMalas:
        document.getElementById("quantidadeMalas").value.trim() || null,
    },
    paradas: formData.itinerario.paradas,
  };
}

// ==================== HANDLERS ESPECÍFICOS ====================
function handleMotivacaoChange(e) {
  const container = document.getElementById("motivacaoOutroContainer");
  const aeroportoContainer = document.getElementById("aeroportoContainer");
  const motivacao = e.target.value;

  // Mostrar/ocultar campo "Outro"
  if (motivacao === "Outro") {
    container.classList.remove("hidden");
    document.getElementById("motivacaoOutro").focus();
  } else {
    container.classList.add("hidden");
    document.getElementById("motivacaoOutro").value = "";
  }

  // Mostrar/ocultar container de aeroporto
  if (motivacao === "Aeroporto") {
    aeroportoContainer.classList.remove("hidden");
    document.getElementById("numeroVoo").focus();
  } else {
    aeroportoContainer.classList.add("hidden");
    // Limpar os campos de aeroporto
    document.getElementById("numeroVoo").value = "";
    document.getElementById("horarioChegada").value = "";
    document.getElementById("quantidadeMalas").value = "";
  }
}

function handleParadasChange(e) {
  const container = document.getElementById("paradasContainer");
  if (e.target.value === "sim") {
    container.classList.remove("hidden");
  } else {
    container.classList.add("hidden");
    // Limpar paradas
    formData.itinerario.paradas = [];
    document.getElementById("paradasList").innerHTML = "";
    paradaCount = 0;
  }
}

function handleIsPJChange(e) {
  const isPJ = e.target.checked;
  const pfFields = document.getElementById("pfFields");
  const pjFields = document.getElementById("pjFields");
  const rgGroup = document.getElementById("pfRgGroup");

  const cpfEl = document.getElementById("cpf");
  const cnpjEl = document.getElementById("cnpj");

  if (isPJ) {
    if (pfFields) pfFields.classList.add("hidden");
    if (pjFields) pjFields.classList.remove("hidden");
    if (rgGroup) rgGroup.classList.add("hidden");
    if (cnpjEl) cnpjEl.placeholder = "00.000.000/0000-00";
    // Focar na razão social
    const razao = document.getElementById("razaoSocial");
    if (razao) razao.focus();
  } else {
    if (pfFields) pfFields.classList.remove("hidden");
    if (pjFields) pjFields.classList.add("hidden");
    if (rgGroup) rgGroup.classList.remove("hidden");
    if (cpfEl) cpfEl.placeholder = "000.000.000-00";
    const nome = document.getElementById("nomeContratante");
    if (nome) nome.focus();
  }
}

// ==================== PARADAS ====================
function addParada() {
  if (paradaCount >= 8) {
    showError("paradas", "Máximo de 8 paradas permitido");
    return;
  }

  clearError("paradas");
  paradaCount++;

  const paradaId = `parada-${paradaCount}`;
  const paradaHTML = `
        <div id="${paradaId}" class="bg-white border border-purple-200 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium text-gray-900">Parada ${paradaCount}</h4>
          <button type="button" id="${paradaId}-remove" class="text-red-600 hover:text-red-800 font-medium">Remover</button>
            </div>
            
            <div class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="flex items-stretch gap-2">
                        <input type="text" id="${paradaId}-cep" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="CEP">
                        <button type="button" id="${paradaId}-buscar" class="h-10 px-3 bg-gray-600 text-white rounded-lg text-sm inline-flex items-center justify-center gap-2 flex-shrink-0">
                            <span id="${paradaId}-buscar-text">Buscar</span>
                            <span id="${paradaId}-buscar-spinner" class="spinner spinner-sm hidden"></span>
                        </button>
                    </div>
                    <div>
                        <input type="text" id="${paradaId}-rua" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Rua">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <input type="text" id="${paradaId}-numero" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Número">
                    </div>
                    <div>
                        <input type="text" id="${paradaId}-complemento" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Complemento">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <input type="text" id="${paradaId}-bairro" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Bairro">
                    </div>
                    <div>
                        <input type="text" id="${paradaId}-cidade" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cidade">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <input type="text" id="${paradaId}-estado" maxlength="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="UF">
                    </div>
                    <div>
                        <input type="date" id="${paradaId}-data" class="w-full px-3 py-2 border rounded-lg text-sm">
                    </div>
                    <div>
                        <input type="text" id="${paradaId}-horario" placeholder="HH:MM" inputmode="numeric" pattern="([01]\d|2[0-3]):[0-5]\d" class="w-full px-3 py-2 border rounded-lg text-sm">
                    </div>
                </div>
            </div>
        </div>
    `;

  document
    .getElementById("paradasList")
    .insertAdjacentHTML("beforeend", paradaHTML);

  // Aplicar máscara CEP para nova parada
  const cepInput = document.getElementById(`${paradaId}-cep`);
  cepInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    e.target.value = value.replace(/(\d{5})(\d)/, "$1-$2");
  });

  // Botão buscar CEP para esta parada
  const buscarCepBtn = document.getElementById(`${paradaId}-buscar`);
  if (buscarCepBtn) {
    buscarCepBtn.addEventListener("click", () => buscarCepParada(paradaId));
  }

  // Máscara UF
  const ufInput = document.getElementById(`${paradaId}-estado`);
  ufInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
  });

  // Máscara do horário para esta parada (inserir ':' automaticamente)
  const horarioInput = document.getElementById(`${paradaId}-horario`);
  if (horarioInput) {
    horarioInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) {
        v = v.slice(0, 2) + ":" + v.slice(2);
      }
      e.target.value = v;
    });
  }

  // Botão remover para esta parada (insere listener quando a parada é criada)
  const removeBtn = document.getElementById(`${paradaId}-remove`);
  if (removeBtn) {
    removeBtn.addEventListener("click", () => removeParada(paradaId));
  }
}
function removeParada(paradaId) {
  document.getElementById(paradaId).remove();
  paradaCount--;
  clearError("paradas");

  // Renumerar paradas
  const paradas = document.querySelectorAll("#paradasList > div");
  paradas.forEach((parada, index) => {
    const titulo = parada.querySelector("h4");
    if (titulo) titulo.textContent = `Parada ${index + 1}`;
  });
}

function collectParadas() {
  const paradas = [];
  const paradaElements = document.querySelectorAll("#paradasList > div");

  paradaElements.forEach((paradaEl) => {
    const id = paradaEl.id;
    const parada = {
      endereco: {
        cep: document.getElementById(`${id}-cep`).value.trim(),
        rua: document.getElementById(`${id}-rua`).value.trim(),
        numero: document.getElementById(`${id}-numero`).value.trim(),
        complemento:
          document.getElementById(`${id}-complemento`).value.trim() || null,
        bairro: document.getElementById(`${id}-bairro`).value.trim(),
        cidade: document.getElementById(`${id}-cidade`).value.trim(),
        estado: document.getElementById(`${id}-estado`).value.trim(),
      },
      data: document.getElementById(`${id}-data`).value,
      horario: document.getElementById(`${id}-horario`).value,
    };

    // Só adicionar se tiver dados preenchidos
    if (parada.endereco.cep || parada.endereco.rua) {
      paradas.push(parada);
    }
  });

  return paradas;
}

// ==================== PASSAGEIROS ====================
function addPassageiro() {
  if (passageiroCount >= 50) {
    showError("passageiros", "Máximo de 50 passageiros permitido");
    return;
  }

  clearError("passageiros");
  passageiroCount++;

  const passageiroId = `passageiro-${passageiroCount}`;
  const passageiroHTML = `
        <div id="${passageiroId}" class="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-3">
            <h4 class="font-medium text-gray-900">Passageiro ${passageiroCount}</h4>
            <button type="button" id="${passageiroId}-remove" class="text-red-600 hover:text-red-800 font-medium text-sm">Remover</button>
          </div>
            
            <div class="space-y-3">
                <div>
                    <input type="text" id="${passageiroId}-nome" class="w-full px-3 py-2 border rounded-lg" placeholder="Nome completo *">
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <input type="number" id="${passageiroId}-idade" min="0" max="120" class="w-full px-3 py-2 border rounded-lg" placeholder="Idade *">
                    </div>
                    <div>
                        <input type="text" id="${passageiroId}-rg" class="w-full px-3 py-2 border rounded-lg" placeholder="RG *">
                    </div>
                </div>
                
                <div>
                    <input type="text" id="${passageiroId}-orgao" class="w-full px-3 py-2 border rounded-lg" placeholder="Órgão expedidor *">
                </div>
            </div>
        </div>
    `;

  document
    .getElementById("passageirosList")
    .insertAdjacentHTML("beforeend", passageiroHTML);

  // Listener para remover passageiro (evita onclick inline que quebra em bundlers)
  const removeBtn = document.getElementById(`${passageiroId}-remove`);
  if (removeBtn) {
    removeBtn.addEventListener("click", () => removePassageiro(passageiroId));
  }

  // Aplicar máscara RG
  const rgInput = document.getElementById(`${passageiroId}-rg`);
  rgInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 9) value = value.slice(0, 9);
    e.target.value = value.replace(/(\d{2})(\d{3})(\d{3})(\d)/, "$1.$2.$3-$4");
  });

  // Focar no nome do passageiro
  document.getElementById(`${passageiroId}-nome`).focus();
}

function removePassageiro(passageiroId) {
  document.getElementById(passageiroId).remove();
  passageiroCount--;
  clearError("passageiros");

  // Renumerar passageiros
  const passageiros = document.querySelectorAll("#passageirosList > div");
  passageiros.forEach((pass, index) => {
    const titulo = pass.querySelector("h4");
    if (titulo) titulo.textContent = `Passageiro ${index + 1}`;
  });

  // Atualizar array
  collectPassageiros();
}

function collectPassageiros() {
  const passageiros = [];
  const passageiroElements = document.querySelectorAll(
    "#passageirosList > div"
  );

  passageiroElements.forEach((passEl) => {
    const id = passEl.id;
    const passageiro = {
      nome: document.getElementById(`${id}-nome`).value.trim(),
      idade: parseInt(document.getElementById(`${id}-idade`).value) || 0,
      rg: document.getElementById(`${id}-rg`).value.trim(),
      orgao_expeditor: document.getElementById(`${id}-orgao`).value.trim(),
    };

    if (passageiro.nome) {
      passageiros.push(passageiro);
    }
  });
  // Atualiza o estado global
  formData.passageiros = passageiros;
  return passageiros;
}

// ==================== FUNÇÕES AUXILIARES FALTANTES (STUBS/IMPLEMENTAÇÃO) ====================
function initializeForm() {
  // Garantir passo inicial
  currentStep = 1;
  updateStepDisplay();

  // Aplicar estado inicial do PJ/PF
  const pjEl = document.getElementById("isPJ");
  if (pjEl) handleIsPJChange({ target: pjEl });
}

function loadDraft() {
  // Placeholder: carregar rascunho do localStorage se desejado
  try {
    const draft = localStorage.getItem("van_booking_draft");
    if (draft) {
      formData = JSON.parse(draft);
      // Não popular campos automaticamente aqui para evitar sobrescrever entradas
    }
  } catch (e) {
    console.warn("Não foi possível carregar rascunho:", e);
  }
}

function saveDraft() {
  try {
    localStorage.setItem("van_booking_draft", JSON.stringify(formData));
  } catch (e) {
    console.warn("Não foi possível salvar rascunho:", e);
  }
}

function focusFirstInput() {
  const visibleStep = document.getElementById(`step${currentStep}`);
  if (!visibleStep) return;
  const firstInput = visibleStep.querySelector(
    "input, select, textarea, button"
  );
  if (firstInput) firstInput.focus();
}

// Resetar todo o formulário para o estado inicial (limpar campos e estado)
function resetForm() {
  // Estado interno
  formData = { contratante: {}, itinerario: { paradas: [] }, passageiros: [] };

  // Campos que devem ser limpos
  const fieldsToClear = [
    "motivacao",
    "motivacaoOutro",
    "razaoSocial",
    "nomeContratante",
    "rgContratante",
    "orgaoExpedidor",
    "cpf",
    "cnpj",
    "telefoneDdd",
    "telefoneContratante",
    "inscricaoEstadual",
    "cepContratante",
    "ruaContratante",
    "numeroContratante",
    "complementoContratante",
    "bairroContratante",
    "cidadeContratante",
    "estadoContratante",

    // Itinerário
    "cepSaida",
    "ruaSaida",
    "numeroSaida",
    "complementoSaida",
    "bairroSaida",
    "cidadeSaida",
    "estadoSaida",
    "dataSaida",
    "horarioSaida",
    "cepChegada",
    "ruaChegada",
    "numeroChegada",
    "complementoChegada",
    "bairroChegada",
    "cidadeChegada",
    "estadoChegada",
    "dataRetorno",
    "horarioRetorno",

    // Aeroporto
    "numeroVoo",
    "horarioChegada",
    "quantidadeMalas",
  ];

  fieldsToClear.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    }
  });

  // Limpar paradas e passageiros do DOM
  const paradasList = document.getElementById("paradasList");
  if (paradasList) paradasList.innerHTML = "";
  paradaCount = 0;

  const passageirosList = document.getElementById("passageirosList");
  if (passageirosList) passageirosList.innerHTML = "";
  passageiroCount = 0;

  // Resetar PJ/PF para PF (padrão)
  const pjEl = document.getElementById("isPJ");
  if (pjEl) {
    pjEl.checked = false;
    handleIsPJChange({ target: pjEl });
  }

  // Limpar mensagens de erro e rascunho
  clearErrors();
  try {
    localStorage.removeItem("van_booking_draft");
  } catch (e) {}

  // Voltar ao primeiro passo e atualizar UI
  currentStep = 1;
  updateStepDisplay();
  focusFirstInput();
}

function buscarCep(tipo) {
  // Busca simples usando viacep apenas quando houver um campo com id correspondente
  try {
    let cepEl, tipo_lower;

    if (tipo === "Contratante") {
      cepEl = document.getElementById("cepContratante");
      tipo_lower = "Contratante";
    } else if (tipo === "Saida") {
      cepEl = document.getElementById("cepSaida");
      tipo_lower = "Saida";
    } else if (tipo === "Chegada") {
      cepEl = document.getElementById("cepChegada");
      tipo_lower = "Chegada";
    } else {
      return;
    }

    const cep = cepEl.value.replace(/\D/g, "");
    if (!cep) return;

    // Mostrar loading
    const spinnerEl = document.getElementById(`buscarCep${tipo}-spinner`);
    const textEl = document.getElementById(`buscarCep${tipo}-text`);
    const btnEl = document.getElementById(`buscarCep${tipo}`);

    if (spinnerEl) spinnerEl.classList.remove("hidden");
    if (textEl) textEl.style.display = "none";
    if (btnEl) btnEl.disabled = true;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.erro) {
          if (tipo_lower === "Contratante") {
            document.getElementById("ruaContratante").value =
              data.logradouro || "";
            document.getElementById("bairroContratante").value =
              data.bairro || "";
            document.getElementById("cidadeContratante").value =
              data.localidade || "";
            document.getElementById("estadoContratante").value = data.uf || "";
          } else if (tipo_lower === "Saida") {
            document.getElementById("ruaSaida").value = data.logradouro || "";
            document.getElementById("bairroSaida").value = data.bairro || "";
            document.getElementById("cidadeSaida").value =
              data.localidade || "";
            document.getElementById("estadoSaida").value = data.uf || "";
          } else if (tipo_lower === "Chegada") {
            document.getElementById("ruaChegada").value = data.logradouro || "";
            document.getElementById("bairroChegada").value = data.bairro || "";
            document.getElementById("cidadeChegada").value =
              data.localidade || "";
            document.getElementById("estadoChegada").value = data.uf || "";
          }
          // Sucesso - mostrar toast
          showToast("CEP encontrado com sucesso!", false);
        } else {
          showToast("CEP não encontrado", true);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar CEP:", err);
        showToast("Erro ao buscar CEP", true);
      })
      .finally(() => {
        // Ocultar loading
        if (spinnerEl) spinnerEl.classList.add("hidden");
        if (textEl) textEl.style.display = "inline";
        if (btnEl) btnEl.disabled = false;
      });
  } catch (e) {
    console.warn("buscarCep erro", e);
  }
}

// Busca CEP para uma parada específica e preenche os campos correspondentes
function buscarCepParada(paradaId) {
  try {
    const cepEl = document.getElementById(`${paradaId}-cep`);
    if (!cepEl) return;
    const cep = cepEl.value.replace(/\D/g, "");
    if (!cep) return;

    // Mostrar loading
    const spinnerEl = document.getElementById(`${paradaId}-buscar-spinner`);
    const textEl = document.getElementById(`${paradaId}-buscar-text`);
    const btnEl = document.getElementById(`${paradaId}-buscar`);

    if (spinnerEl) spinnerEl.classList.remove("hidden");
    if (textEl) textEl.style.display = "none";
    if (btnEl) btnEl.disabled = true;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.erro) {
          const prefix = `${paradaId}-`;
          const rua = document.getElementById(prefix + "rua");
          const bairro = document.getElementById(prefix + "bairro");
          const cidade = document.getElementById(prefix + "cidade");
          const estado = document.getElementById(prefix + "estado");

          if (rua) rua.value = data.logradouro || "";
          if (bairro) bairro.value = data.bairro || "";
          if (cidade) cidade.value = data.localidade || "";
          if (estado) estado.value = data.uf || "";

          showToast("CEP encontrado com sucesso!", false);
        } else {
          showToast("CEP não encontrado", true);
        }
      })
      .catch((err) => {
        console.warn("buscarCepParada erro", err);
        showToast("Erro ao buscar CEP", true);
      })
      .finally(() => {
        // Ocultar loading
        if (spinnerEl) spinnerEl.classList.add("hidden");
        if (textEl) textEl.style.display = "inline";
        if (btnEl) btnEl.disabled = false;
      });
  } catch (e) {
    console.warn("buscarCepParada erro", e);
  }
}

function renderReview() {
  const container = document.getElementById("reviewContent");
  if (!container) return;
  // Atualiza os dados de passageiros antes de renderizar
  collectPassageiros();
  saveStepData();

  container.innerHTML = "";
  const contratante = formData.contratante || {};
  const itinerario = formData.itinerario || {};
  const aeroporto = itinerario.aeroporto || {};

  const html = [];
  html.push(
    `<div><strong>Contratante:</strong> ${contratante.nome || "-"} (${
      contratante.cpf_cnpj || "-"
    })</div>`
  );
  if (itinerario.saida) {
    html.push(
      `<div><strong>Saída:</strong> ${itinerario.saida.endereco.rua || "-"}, ${
        itinerario.saida.endereco.numero || "-"
      } - ${itinerario.saida.endereco.cidade || "-"} / ${
        itinerario.saida.endereco.estado || "-"
      }</div>`
    );
  }
  if (itinerario.chegada) {
    html.push(
      `<div><strong>Chegada:</strong> ${
        itinerario.chegada.endereco.rua || "-"
      }, ${itinerario.chegada.endereco.numero || "-"} - ${
        itinerario.chegada.endereco.cidade || "-"
      } / ${itinerario.chegada.endereco.estado || "-"}</div>`
    );
  }

  // Mostrar dados de aeroporto se aplicável
  if (contratante.motivacao === "Aeroporto") {
    html.push(`<div><strong>Dados do Aeroporto:</strong></div>`);
    html.push(`<div class="ml-4">Voo: ${aeroporto.numeroVoo || "-"}</div>`);
    html.push(
      `<div class="ml-4">Horário de Chegada: ${
        aeroporto.horarioChegada || "-"
      }</div>`
    );
    html.push(
      `<div class="ml-4">Quantidade de Malas: ${
        aeroporto.quantidadeMalas || "-"
      }</div>`
    );
  }

  html.push(
    `<div><strong>Passageiros (${formData.passageiros.length}):</strong></div>`
  );
  formData.passageiros.forEach((p, i) => {
    html.push(
      `<div class="ml-4">${i + 1}. ${p.nome || "-"} • ${
        p.idade || "-"
      } anos • RG: ${p.rg || "-"}</div>`
    );
  });

  container.innerHTML = html.join("\n");
}

async function submitForm(e) {
  e.preventDefault();
  // Recolher passageiros e salvar dados atuais
  collectPassageiros();
  saveStepData();

  if (!validateCurrentStep()) {
    showToast("Erro de validação. Verifique os campos.", true);
    return;
  }

  const submitBtnText = document.getElementById("submitBtnText");
  const submitBtnSpinner = document.getElementById("submitBtnSpinner");
  submitBtnText && (submitBtnText.style.display = "none");
  submitBtnSpinner && submitBtnSpinner.classList.remove("hidden");

  const url = `${API_BASE}${API_RESERVAS_ROUTE}`;
  const payload = buildPayloadForDjango(formData);

  console.log("Submitting to", url, "payload:", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let responseData = null;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    if (!res.ok) {
      console.error("Request failed", {
        url,
        status: res.status,
        body: responseData,
      });
      throw new Error(
        (responseData && responseData.message) ||
          responseData ||
          res.statusText ||
          "Erro no envio"
      );
    }

    console.log("Request succeeded", {
      status: res.status,
      body: responseData,
    });
    // Mostrar overlay de sucesso centralizado
    showSuccessOverlay(
      "Solicitação enviada com sucesso! Recebemos sua solicitação e em breve entraremos em contato para confirmar sua reserva. Agradecemos a preferência."
    );
    // Resetar formulário para evitar envios duplicados
    resetForm();
    try {
      localStorage.removeItem("van_booking_draft");
    } catch (e) {}
  } catch (err) {
    console.error("submitForm error:", err);
    showToast(`Falha ao enviar: ${err.message}`, true);
  } finally {
    submitBtnSpinner && submitBtnSpinner.classList.add("hidden");
    submitBtnText && (submitBtnText.style.display = "inline");
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.remove("hidden");
  toast.style.backgroundColor = isError ? "#dc2626" : "#16a34a";
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

// Mostra um overlay de sucesso centralizado com mensagem e logo
function showSuccessOverlay(message) {
  // Evita duplicar overlays
  if (document.getElementById("successOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "successOverlay";
  overlay.setAttribute("role", "alert");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "2000";
  overlay.style.background = "rgba(0,0,0,0.25)";

  const box = document.createElement("div");
  box.className = "success-box";
  box.style.backgroundColor = "#e8f5e9"; // verde claro e suave
  box.style.color = "#1b5e20";
  box.style.padding = "1.5rem";
  box.style.borderRadius = "0.75rem";
  box.style.maxWidth = "28rem";
  box.style.width = "90%";
  box.style.textAlign = "center";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";

  const msg = document.createElement("p");
  msg.style.fontSize = "1rem";
  msg.style.fontWeight = "600";
  msg.style.lineHeight = "1.4";
  msg.textContent = message;

  const logo = document.createElement("img");
  logo.src = "./media/logo_acciari_65.png";
  logo.alt = "Logo acciari";
  logo.className = "success-logo";
  logo.style.height = "56px";
  logo.style.width = "auto";
  logo.style.display = "block";
  logo.style.margin = "0.75rem auto 0";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "success-close";
  closeBtn.innerHTML = "✕";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "1rem";
  closeBtn.style.right = "1rem";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.color = "#2e7d32"; /* cor do ícone fechar */
  closeBtn.style.fontSize = "1.25rem";
  closeBtn.style.cursor = "pointer";

  // Função de limpeza: remove overlay e restaura estado do body
  function cleanup() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeyDown);
  }

  closeBtn.addEventListener("click", cleanup);

  box.appendChild(closeBtn);
  box.appendChild(msg);
  box.appendChild(logo);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Bloqueia scroll do body enquanto o overlay está aberto
  document.body.style.overflow = "hidden";

  // Fechar com ESC
  function onKeyDown(e) {
    if (e.key === "Escape") cleanup();
  }

  document.addEventListener("keydown", onKeyDown);
  // Focar o botão de fechar para acessibilidade
  closeBtn.focus();
}
