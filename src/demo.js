import {uid,today} from './domain.mjs';
export function demoData(){
const date=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
return {profile:{full_name:'Alex',career:'Tecnicatura en Programación',university:'Universidad Tecnológica Nacional',years:2,current_year:2},subjects:[
{id:'s1',name:'Programación III',year:2,semester:'2.º cuatrimestre',teacher:'Mariana López',color:'sage',status:'Cursando',schedule:'Lunes y miércoles · 18:00',description:'Diseño de aplicaciones, colecciones y persistencia.'},
{id:'s2',name:'Base de Datos II',year:2,semester:'2.º cuatrimestre',teacher:'Diego Fernández',color:'lavender',status:'Cursando',schedule:'Martes · 19:00',description:'Consultas, transacciones y diseño de bases de datos.'},
{id:'s3',name:'Inglés Técnico II',year:2,semester:'2.º cuatrimestre',teacher:'Lucía Torres',color:'peach',status:'Cursando',schedule:'Jueves · 18:00',description:'Lectura y comunicación en entornos tecnológicos.'},
{id:'s4',name:'Legislación',year:2,semester:'2.º cuatrimestre',teacher:'Pablo Ruiz',color:'blue',status:'Cursando',schedule:'Viernes · 18:00',description:'Responsabilidades y marco normativo profesional.'},
{id:'s5',name:'Programación I',year:1,semester:'1.º cuatrimestre',teacher:'',color:'sage',status:'Aprobada',schedule:'',description:''},
{id:'s6',name:'Matemática',year:1,semester:'Anual',teacher:'',color:'lavender',status:'Aprobada',schedule:'',description:''}],
assessments:[
{id:'e1',subject_id:'s1',title:'Segundo parcial',type:'Parcial',date:date(3),topics:'Colecciones · interfaces · manejo de excepciones',status:'Pendiente',grade:'',weight:30},
{id:'e2',subject_id:'s2',title:'TP integrador',type:'Trabajo práctico',date:date(6),topics:'Modelo relacional y consultas SQL',status:'Pendiente',grade:'',weight:40},
{id:'e3',subject_id:'s3',title:'Presentación oral',type:'Parcial',date:date(9),topics:'Presentación de un proyecto tecnológico',status:'Pendiente',grade:'',weight:50},
{id:'e4',subject_id:'s1',title:'Primer parcial',type:'Parcial',date:date(-14),topics:'POO y clases abstractas',status:'Aprobado',grade:'8',weight:30},
{id:'e5',subject_id:'s1',title:'TP de colecciones',type:'Trabajo práctico',date:date(-7),topics:'List, Set y Map',status:'Aprobado',grade:'9',weight:40},
{id:'e6',subject_id:'s2',title:'Primer parcial',type:'Parcial',date:date(-9),topics:'Normalización',status:'Aprobado',grade:'7',weight:60},
{id:'e7',subject_id:'s3',title:'Comprensión lectora',type:'Trabajo práctico',date:date(-5),topics:'Documentación técnica',status:'Aprobado',grade:'8',weight:50},
{id:'e8',subject_id:'s4',title:'Coloquio',type:'Final',date:date(14),topics:'Contratos y responsabilidad profesional',status:'Pendiente',grade:'',weight:100}],
notes:[{id:'n1',subject_id:'s1',title:'Colecciones en Java',content:'Set no permite elementos duplicados. List mantiene el orden y admite repetidos. Map relaciona claves únicas con valores.\n\nRepasar equals() y hashCode() antes del parcial.',url:'',created_at:new Date().toISOString()}, {id:'n2',subject_id:'s2',title:'Guía de consultas SQL',content:'JOIN: combina filas de dos tablas a partir de una relación.\nGROUP BY: agrupa registros para aplicar funciones de agregación.\nHAVING: filtra resultados agrupados.',url:'',created_at:new Date().toISOString()}]};}
