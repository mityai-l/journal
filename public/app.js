let db=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function init(){try{db=await(await fetch("public-data.json")).json();fillGroups()}catch(e){document.querySelector("main").innerHTML='<section class="card"><h2>Данные пока не опубликованы</h2><p>Администратор должен загрузить файл public-data.json в репозиторий.</p></section>'}}
function fillGroups(){$("group").innerHTML='<option value="">— выберите группу —</option>'+db.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");$("group").onchange=fillStudents}
function fillStudents(){const gid=$("group").value,st=db.students.filter(s=>s.groupId===gid).sort((a,b)=>(a.number||999)-(b.number||999));$("student").innerHTML='<option value="">— выберите студента —</option>'+st.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");$("student").onchange=render;clearView()}
function clearView(){$("studentTitle").textContent="Выберите студента";$("summary").innerHTML="";$("attendance").innerHTML="";$("practicals").innerHTML="";$("grades").innerHTML=""}
function stats(id){
 const ats=db.attendance.filter(a=>a.studentId===id),
       present=ats.filter(a=>a.status==="present").length,
       ap=ats.length?present/ats.length*100:0;
 const ps=db.practicals.filter(x=>x.studentId===id && x.workId);
 const values=ps.map(x=>{
   const work=db.practicals.find(p=>p.id===x.workId);
   const max=Number(work?.max ?? x.max ?? db.settings.practical_max ?? 10);
   const score=Number(x.score ?? 0);
   return max>0 ? Math.min(100,Math.max(0,score/max*100)) : 0;
 });
 const pp=values.length?values.reduce((a,x)=>a+x,0)/values.length:0;
 const rating=ap*(Number(db.settings.attendance_weight||0)/100)+pp*(Number(db.settings.practical_weight||0)/100);
 return{ap,pp,rating,ats,ps}
}
function render(){
 const id=$("student").value,s=db.students.find(x=>x.id===id);if(!s){clearView();return}
 const st=stats(id);$("studentTitle").textContent=s.name;
 $("summary").innerHTML=`<div class="metric"><span>Посещаемость</span><b>${st.ap.toFixed(1)}%</b><div class="progress"><i style="width:${st.ap}%"></i></div></div><div class="metric"><span>Практические работы</span><b>${st.pp.toFixed(1)}%</b><div class="progress"><i style="width:${st.pp}%"></i></div></div><div class="metric"><span>Итоговый рейтинг</span><b>${st.rating.toFixed(2)} / 100</b><div class="progress"><i style="width:${st.rating}%"></i></div></div>`;
 const ats=st.ats.map(a=>{const l=db.lessons.find(x=>x.id===a.lessonId);return {...a,l}}).sort((a,b)=>String(b.l?.date).localeCompare(String(a.l?.date)));
 $("attendance").innerHTML=ats.length?`<div class="chart">${attendanceChart(ats)}</div><table><tr><th>Дата</th><th>Предмет</th><th>Тема</th><th>Статус</th><th>Баллы</th></tr>${ats.map(a=>`<tr><td>${a.l?.date||""}</td><td>${esc(a.l?.subject)}</td><td>${esc(a.l?.topic)}</td><td>${a.status==="present"?"Присутствовал":a.status==="late"?"Опоздал":"Отсутствовал"}</td><td>${a.status==="present"?1:0}</td></tr>`).join("")}</table>`:'<p class="small">Записей нет.</p>';
 const ps=st.ps.map(x=>({...x,w:db.practicals.find(p=>p.id===x.workId)}));
 $("practicals").innerHTML=ps.length?`<table><tr><th>Дата</th><th>Работа</th><th>Баллы</th></tr>${ps.map(x=>`<tr><td>${x.w?.date||""}</td><td>${esc(x.w?.title)}</td><td class="score">${x.score} / ${x.w?.max||10}</td></tr>`).join("")}</table>`:'<p class="small">Записей нет.</p>';
 const gs=db.grades.filter(g=>g.studentId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $("grades").innerHTML=gs.length?`<table><tr><th>Дата</th><th>Предмет</th><th>Тип</th><th>Оценка</th></tr>${gs.map(g=>`<tr><td>${g.date}</td><td>${esc(g.subject)}</td><td>${esc(g.type)}</td><td class="score">${g.value}</td></tr>`).join("")}</table>`:'<p class="small">Оценок нет.</p>';
}
function attendanceChart(ats){
 const total=ats.length,p=ats.filter(a=>a.status==="present").length,l=ats.filter(a=>a.status==="late").length,a=ats.filter(a=>a.status==="absent").length;
 const rows=[["Присутствовал",p],["Опоздал",l],["Отсутствовал",a]];
 return rows.map(x=>`<div class="barrow"><span>${x[0]}</span><div class="bar"><i style="width:${total?x[1]/total*100:0}%"></i></div><b>${x[1]}</b></div>`).join("");
}
init();