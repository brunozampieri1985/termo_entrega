//Config

const DEFAULT_DEADLINE = 45;
const FERIADOS = ["01/01", "25/01"];
const LOJAS = {
  carrao: {
    nome: "CARRÃO",
    cnpj: "32.263.298/0001-19",
    endereco: "Avenida Conselheiro Carrão, 1736 - Vila Carrão - São Paulo - SP",
  },
  perdizes: {
    nome: "PERDIZES",
    cnpj: "32.263.298/0001-19",
    endereco: "Av. Francisco Matarazzo, 969 - Água Branca - São Paulo - SP",
  },
};

// Helpers

async function delay(time) {
  return new Promise((resolve) => setTimeout(() => resolve(), time));
}

function createEl(element, attr) {
  const el = document.createElement(element);
  if (attr) {
    for (let a in attr) {
      el.setAttribute(a, attr[a]);
    }
  }
  return el;
}

function qs(selector) {
  return document.querySelector(selector);
}

const formatDate = {
  get: (date) => {
    const dt = new Date(date.toString()).toISOString();
    const year = dt.slice(0, 4);
    const month = dt.slice(5, 7);
    const day = dt.slice(8, 10);
    const formatted = `${year}-${month}-${day}`;
    return formatted;
  },
  set: (date) => {
    const dt = new Date(date.toString()).toISOString();
    const year = dt.slice(0, 4);
    const month = dt.slice(5, 7);
    const day = dt.slice(8, 10);
    const formatted = `${day}/${month}/${year}`;
    return formatted;
  },
};

function isHoliday(date) {
  let result = false;
  const dt = new Date(date.toString()).toISOString();
  const month = dt.slice(5, 7);
  const day = dt.slice(8, 10);
  const formatted = `${day}/${month}`;
  for (const feriado of FERIADOS) {
    if (feriado === formatted) result = true;
  }
  return result;
}

function isUtil(date) {
  if (isHoliday(date)) return false;
  const weekday = date.slice(0, 3);
  if (weekday === "Sat" || weekday === "Sun") return false;
  return true;
}

function getDeadline(days, startDate) {
  let finishDate = dayjs(startDate);
  let utilDays = 0;

  while (utilDays < days) {
    let newDate = finishDate.add(1, "days");
    if (isUtil(newDate.$d.toString())) {
      utilDays++;
    }
    finishDate = newDate;
  }
  return new Date(finishDate).toString();
}

function calculate(days, startDate) {
  entrega.value = formatDate.get(
    getDeadline(days ?? DEFAULT_DEADLINE, startDate ?? assinatura.value)
  );
}

// DOM Elements
const body = qs("body");
const loja = qs("#loja");
const nome = qs("#nome");
const contrato = qs("#contrato");
const rg = qs("#rg");
const cpf = qs("#cpf");
const assinatura = qs("#assinatura");
const prazo = qs("#prazo");
const entrega = qs("#entrega");
const hidraulicaSim = qs("#hidraulica_sim");
const hidraulicaNao = qs("#hidraulica_nao");
const eletricaSim = qs("#eletrica_sim");
const eletricaNao = qs("#eletrica_nao");
const btnGerar = qs("#btnGerar");

function createTermo() {
  return {
    loja: loja.value,
    nome: nome.value,
    contrato: contrato.value,
    rg: rg.value,
    cpf: cpf.value,
    assinatura: assinatura.value,
    prazo: prazo.value,
    entrega: formatDate.set(entrega.value),
    hidraulica: hidraulicaSim.checked,
    eletrica: eletricaSim.checked,
  };
}

function saveLastTermo() {
  const termo = createTermo();
  sessionStorage.setItem("termo", JSON.stringify(termo));
}

function getLastTermo() {
  const local = sessionStorage.getItem("termo");
  if (local) return JSON.parse(local);
  return null;
}

function validate() {
  const errors = [];

  if (nome.value === "") {
    registerError("Você precisa fornecer o nome completo.");
  }
  if (rg.value === "") {
    registerError("Você precisa fornecer o RG.");
  }
  if (cpf.value === "") {
    registerError("Você precisa fornecer o CPF.");
  }
  if (contrato.value === "") {
    registerError("Você precisa fornecer o Nº do contrato.");
  }
  if (prazo.value < 30) {
    registerError(
      `Prazo informado (${prazo.value}) menor do que o mínimo permitido (30)`
    );
  }

  function registerError(error) {
    errors.push(error);
  }

  return { errors };
}

function savePDF(filename, element) {
  const options = {
    filename: `Termo Entrega - ${filename}.pdf`,
    margin: 0,
  };
  html2pdf().set(options).from(element).save();
}

// Events

// Event - Load
window.addEventListener("load", async () => {
  assinatura.value = formatDate.get(new Date());
  prazo.value = DEFAULT_DEADLINE;
  eletricaNao.checked = true;
  hidraulicaNao.checked = true;
  const lastTermo = getLastTermo();
  if (lastTermo) {
    (loja.value = lastTermo.loja), (nome.value = lastTermo.nome);
    rg.value = lastTermo.rg;
    cpf.value = lastTermo.cpf;
    contrato.value = lastTermo.contrato;
    assinatura.value = lastTermo.assinatura;
    prazo.value = lastTermo.prazo;
    entrega.value = lastTermo.entrega;
    hidraulicaSim.value = lastTermo.hidraulica;
    hidraulicaNao.value = !lastTermo.hidraulica;
    eletricaSim.value = lastTermo.eletrica;
    eletricaNao.value = !lastTermo.eletrica;
  }
  calculate(prazo.value, assinatura.value);
});

// Event - Form Changes
assinatura.addEventListener("change", (e) => {
  console.log();
  calculate(prazo.value, e.target.value);
});

prazo.addEventListener("change", (e) => {
  calculate(e.target.value, assinatura.value);
});

// Event- Generate
btnGerar.addEventListener("click", async () => {
  const { errors } = validate();
  if (errors.length > 0) {
    function closeDialog(element) {
      element.innerHTML = "";
      element.close();
    }
    const errWrapper = qs("#erro");
    const errContainer = createEl("dialog", { id: "#errors" });
    errWrapper.append(errContainer);
    for (let error of errors) {
      const el = createEl("p", { class: "error" });
      el.innerHTML = error;
      errContainer.append(el);
    }
    const btnClose = createEl("button");
    btnClose.textContent = "Entendi";
    btnClose.addEventListener("click", () => closeDialog(errContainer));
    errContainer.append(btnClose);
    errContainer.showModal();
    setTimeout(() => {
      closeDialog(errContainer);
    }, 2000);
    return;
  }
  const term = createTermo();
  const html = `
  <section class='pdf'>
  <div class='empresa'>
    <h3>ITALÍNEA | FG PLUS - LTDA (${LOJAS[term.loja].nome})</h3>
    <p>CNPJ: 32.263.298/0001-19</p>
    <p>${LOJAS[term.loja].endereco}</p>
  </div>
  <h1>Termo de Entrega de Projeto Executivo</h1>
  <div class='dados'>
  <p>Nome: <strong>${term.nome}</strong></p>
  <p>CPF: <strong>${term.cpf}</strong></p>
  <p>RG: <strong>${term.rg}</strong></p>
  <p>Contrato: <strong>${term.contrato}</strong></p>
  <p>Data de Entrega: <strong>${term.entrega}</strong></p>
  <p>Planta Hidráulica: <strong>${
    term.hidraulica ? "Entregue" : "Não Entregue"
  }</strong></p>
  <p>Planta Elétrica: <strong>${
    term.eletrica ? "Entregue" : "Não Entregue"
  }</strong></p>
  </div>
  <br>
  <div class='conteudo'>
    <p>
      Eu, ${term.nome}, portador do do RG ${
    term.rg
  } devidamente inscrito (a) no CPF/MF sob o nº ${
    term.cpf
  }, declaro estar de acordo com o(s) projeto(s) final(is) do(s) ambiente(s) contratado(s), concordando com o layout ( medidas e disposição ) apresentado(s) para o(s) ambiente(s), conforme o PROJETO FINAL anexo a este documento, bem como declaro ciência para o descrito abaixo:
    </p>
    <ul>
    <li>PLANTAS (HIDRÁULICA/ELÉTRICA): Caso não seja possível a entrega das plantas hidráulicas e elétricas até esta data, o cliente se compromete a disponibilizar para o montador, na ocasião da montagem. Caso contrário, assumirá os riscos e eventuais custos provenientes da danificação de canos e tubulações.</li>
      <li>PASTILHAS E PAPEL DE PAREDE: Deverá ser colocado após montagem dos móveis.</li>
      <li>PINTURA NO AMBIENTE: Poderá haver necessidade de uma última mão nas paredes após término da montagem.</li>
      <li>AJUSTES DE MARCENARIA: Poderá haver serviços de marcenaria no local. Como redução de profundidade, ajuste de prateleiras etc.</li>
      <li>GARANTIA: Conforme descrita no contrato de compra e venda . </li>
      <li>RODAPÉ: O rodapé na área de montagem deverá ser retirado pelo cliente antes da instalação dos móveis,ou colocado após a montagem, caso contrário, a montagem será desenvolvida com adaptações.</li>
      <li>MOLDURA DE GESSO: Deve ser retirada pelo cliente antes da instalação dos móveis as molduras de gesso (caso impeça que o móvel fique rente a parede ou fechamento/tamponamento rente ao teto), caso contrário, a montagem será desenvolvida com adaptações.</li>
      <li>TOMADAS/ELETRICA: Os montadores não estão autorizados a fazer modificações elétricas. As tomadas que ficarem atrás dos móveis serão transferidas para o fundo ou lateral do móvel, Caso seja necessário deslocar alguma tomada através dos móveis o cliente deverá levar um profissional para fazer as modificações no dia da montagem. As referencias de spot e fita de LED no projeto, não estão inclusas, somente há orientação para o montador instalar desde que estes estejam no local no ato da montagem.</li>
      <li>GRANITO: Caso o mesmo não esteja instalado no ato da medição, deverá solicitar a fabricação da pia somente após finalização da montagem dos móveis. Cliente ciente que deverá fazer o rodapé de granito após a montagem para ocultar os pés de plástico caso necessários para sustentação de balcões</li>
      <li>AMBIENTE EM REFORMA:Caso a medição ocorra com o imóvel em obras, qualquer diferença de medidas, será de responsabilidade do cliente, inclusive forro de gesso.</li>
      <li>IRREGULARIDADES NA ALVENARIA: A empresa não se responsabiliza por quaisquer irregularidades nas paredes, pisos, colunas, gesso ou teto. Ficando ciente que somente no ato da montagem poderá ser detectado esse tipo de eventualidade. Os móveis não se adequarão a esse tipo de defeito.</li>
      <li>ELETROS: Os eletrodomésticos, forno e micro ondas deverão estar no local no ato da montagem para que o montador possa fazer os acabamentos necessários. Caso estes não estejam, o retorno do montador para instalar, será cobrado do cliente uma taxa de visita extra. </li>
      <li>PAREDES DE DRY WALL: Conforme contrato o cliente deverá fornecer as buchas de drywall ( TOGLER BOLTS) para ambientes com esta necessidade</li>
    </ul>
    <div class='assinatura'>
      <div class='assinatura__espaco'></div>
      <p>${term.nome}</p>
    </div>
  </div>
  </div>
</section>
    `;
  body.innerHTML = html;
  const section = qs("section");
  setTimeout(() => {
    //savePDF(term.nome, section);
    const btnVoltar = createEl("button");
    btnVoltar.textContent = "Voltar";
    btnVoltar.addEventListener("click", () => {
      location.reload();
    });
    body.append(btnVoltar);
  }, 3000);
  saveLastTermo();
});