const chave = "dba3cea00e2041cd82b183918262402";

const cidadeEl = document.getElementById("cidade");
const tempEl = document.getElementById("temperatura");
const descEl = document.getElementById("descricao");
const forecastEl = document.getElementById("forecast");
let grafico, map;

/* BUSCAR CIDADE */
async function buscarCidade(){
  const cidade = document.getElementById("cidadeInput").value;
  if(!cidade) return;
  buscarClima(cidade);
}

/* GEOLOCALIZAÇÃO */
function buscarLocalizacao(){
  navigator.geolocation.getCurrentPosition(pos=>{
    buscarClima(`${pos.coords.latitude},${pos.coords.longitude}`);
  });
}

/* API */
async function buscarClima(query){
  const resposta = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${chave}&q=${query}&days=7&lang=pt`
  );
  const dados = await resposta.json();
  if(dados.error){ alert("Cidade não encontrada"); return; }
  atualizarTela(dados);
}

/* ATUALIZAR UI */
function atualizarTela(dados){
  cidadeEl.innerText = dados.location.name;
  tempEl.innerText = dados.current.temp_c + "°";
  descEl.innerText = dados.current.condition.text;
  aplicarFundo(dados);
  mostrarForecast(dados);
  criarGrafico(dados);
  criarMapa(dados);
  aplicarAnimacao(dados.current.condition.text);
}

/* FUNDO DINÂMICO COM GRADIENTE */
function aplicarFundo(dados){
  const bg = document.querySelector(".bg-layer");
  const cond = dados.current.condition.text.toLowerCase();
  const isDay = dados.current.is_day===1;
  let gradient="";

  if(cond.includes("chuva")||cond.includes("rain")){
    gradient="linear-gradient(135deg, #3a7bd5, #00d2ff)";
  } else if(cond.includes("neve")||cond.includes("snow")){
    gradient="linear-gradient(135deg, #e0eafc, #cfdef3)";
  } else if(cond.includes("nublado")||cond.includes("cloud")){
    gradient="linear-gradient(135deg, #bdc3c7, #2c3e50)";
  } else {
    gradient=isDay
      ? "linear-gradient(135deg, #fbc2eb, #a6c1ee)"
      : "linear-gradient(135deg, #2c3e50, #4ca1af)";
  }

  bg.style.backgroundImage = gradient;
}

/* FORECAST */
function mostrarForecast(dados){
  forecastEl.innerHTML="";
  dados.forecast.forecastday.forEach(dia=>{
    forecastEl.innerHTML+=`
      <div class="day-card">
        <p>${dia.date}</p>
        <img src="https:${dia.day.condition.icon}">
        <p>${dia.day.avgtemp_c}°</p>
      </div>`;
  });
}

/* GRÁFICO */
function criarGrafico(dados){
  if(grafico) grafico.destroy();
  grafico=new Chart(document.getElementById("graficoTemp"),{
    type:"line",
    data:{
      labels:dados.forecast.forecastday.map(d=>d.date),
      datasets:[{
        data:dados.forecast.forecastday.map(d=>d.day.avgtemp_c),
        borderWidth:3,
        tension:0.4,
        borderColor: "#00c6ff",
        backgroundColor: "rgba(0,198,255,0.2)"
      }]
    },
    options:{plugins:{legend:{display:false}}, scales:{y:{display:false},x:{display:false}}}
  });
}

/* MAPA */
function criarMapa(dados){
  if(map) map.remove();
  map = L.map('map').setView([dados.location.lat,dados.location.lon],10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([dados.location.lat,dados.location.lon]).addTo(map);
}

/* ANIMAÇÃO CHUVA/NEVE */
const canvas=document.getElementById("weatherCanvas");
const ctx=canvas.getContext("2d");
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
resizeCanvas(); window.addEventListener("resize",resizeCanvas);

let particles=[],clima="clear";
function aplicarAnimacao(cond){
  cond=cond.toLowerCase();
  if(cond.includes("chuva")||cond.includes("rain")){clima="rain";criarChuva();}
  else if(cond.includes("neve")||cond.includes("snow")){clima="snow";criarNeve();}
  else{clima="clear";particles=[];}
}

function criarChuva(){
  particles=[];
  for(let i=0;i<200;i++){
    particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,l:Math.random()*20,s:Math.random()*8+4});
  }
}
function criarNeve(){
  particles=[];
  for(let i=0;i<150;i++){
    particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3,s:Math.random()*2+1});
  }
}

function animar(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(clima==="rain"){
    ctx.strokeStyle="rgba(255,255,255,0.5)";
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.moveTo(p.x,p.y);
      ctx.lineTo(p.x,p.y+p.l);
      ctx.stroke();
      p.y+=p.s;
      if(p.y>canvas.height)p.y=-10;
    });
  }
  if(clima==="snow"){
    ctx.fillStyle="white";
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
      p.y+=p.s;
      if(p.y>canvas.height)p.y=-10;
    });
  }
  requestAnimationFrame(animar);
}
animar();

/* SCROLL ELÁSTICO */
const appEl = document.querySelector(".app");
appEl.addEventListener("scroll", ()=>{
  appEl.style.backdropFilter = `blur(${30 + appEl.scrollTop/20}px)`;
});