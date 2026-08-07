#!/usr/bin/env node
// Alarma para el riesgo real de este backend: como db() usa service_role e
// ignora RLS, la UNICA barrera contra que un endpoint quede abierto a
// cualquiera es que su codigo llame a exigirPermiso() o exigirAccesoObra().
// Antes RLS tapaba ese descuido aunque fuera mal; ahora no tapa nada.
//
// Este script recorre cada funcion de supabase/functions/*/index.ts y avisa
// si toca la base (db()) sin ningun chequeo de autorizacion visible. No
// entiende el codigo de verdad (es un heuristico por texto), asi que una
// funcion que SI verifica permisos correctamente puede necesitar la marca
// explicita "// AUTORIZACION: ..." si el script no la detecta sola — mejor
// un falso positivo revisado a mano que un endpoint abierto sin que nadie
// lo note.
//
// Se corre con: npm run check:permisos (ademas de a mano cuando se agregue
// un endpoint nuevo, antes del deploy).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dirname, "..", "supabase", "functions");
const MARCA_AUTORIZACION = /exigirPermiso\(|exigirAccesoObra\(|\/\/\s*AUTORIZACION:/;

function archivosDeFunciones() {
  return readdirSync(RAIZ)
    .filter((nombre) => nombre !== "_shared" && statSync(join(RAIZ, nombre)).isDirectory())
    .map((nombre) => join(RAIZ, nombre, "index.ts"));
}

// Parte el archivo en bloques por cada "function" de nivel superior (top-level,
// sin indentacion), usando conteo de llaves para saber donde termina cada uno.
// La marca "// AUTORIZACION:" se busca tambien en los comentarios de las
// lineas inmediatamente anteriores a la firma, no solo dentro del cuerpo.
function funcionesDelArchivo(codigo) {
  const bloques = [];
  const lineas = codigo.split("\n");
  let actual = null;
  let llaves = 0;
  let comentarioPrevio = [];

  for (const linea of lineas) {
    const inicioFuncion = /^(async )?function (\w+)/.exec(linea);
    if (!actual && inicioFuncion) {
      actual = { nombre: inicioFuncion[2], texto: comentarioPrevio.join("\n") + "\n" };
      llaves = 0;
    }
    if (actual) {
      actual.texto += linea + "\n";
      llaves += (linea.match(/{/g) ?? []).length;
      llaves -= (linea.match(/}/g) ?? []).length;
      if (llaves <= 0 && actual.texto.includes("{")) {
        bloques.push(actual);
        actual = null;
      }
    }

    // Se acumulan lineas de comentario consecutivas para pegarlas a la
    // proxima funcion; cualquier otra linea (codigo, blanco) las descarta.
    comentarioPrevio = /^\s*\/\//.test(linea) ? [...comentarioPrevio, linea] : [];
  }
  return bloques;
}

let problemas = 0;

for (const archivo of archivosDeFunciones()) {
  const codigo = readFileSync(archivo, "utf8");
  const modulo = archivo.split(/[\\/]/).slice(-2, -1)[0];

  for (const fn of funcionesDelArchivo(codigo)) {
    const tocaLaBase = /\bdb\(\)/.test(fn.texto);
    if (!tocaLaBase) continue;

    if (!MARCA_AUTORIZACION.test(fn.texto)) {
      problemas++;
      console.log(`⚠️  ${modulo}/index.ts -> ${fn.nombre}(): toca db() sin exigirPermiso/exigirAccesoObra ni marca "// AUTORIZACION:"`);
    }
  }
}

if (problemas === 0) {
  console.log("✅ Todas las funciones que tocan la base tienen un chequeo de autorizacion visible.");
} else {
  console.log(`\n${problemas} funcion(es) para revisar antes de desplegar.`);
  process.exit(1);
}
