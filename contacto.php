<?php
/**
 * Handler del formulario de contacto de vetro.ar
 * Recibe el POST del formulario en contacto.html y envía el mail a hola@vetro.ar
 */

header('Content-Type: application/json; charset=utf-8');

$destino = 'hola@vetro.ar';

function responder($ok, $mensaje) {
    echo json_encode(['ok' => $ok, 'mensaje' => $mensaje]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.');
}

// Honeypot: campo invisible para bots. Si viene lleno, fingimos éxito y no enviamos nada.
if (!empty($_POST['website'])) {
    responder(true, 'Mensaje enviado.');
}

function limpiar($valor) {
    $valor = trim($valor ?? '');
    // evita inyección de headers en campos de una sola línea
    $valor = str_replace(["\r", "\n"], ' ', $valor);
    return $valor;
}

$nombre   = limpiar($_POST['nombre'] ?? '');
$empresa  = limpiar($_POST['empresa'] ?? '');
$telefono = limpiar($_POST['telefono'] ?? '');
$email    = limpiar($_POST['email'] ?? '');
$asunto   = limpiar($_POST['asunto'] ?? '');
$mensaje  = trim($_POST['mensaje'] ?? '');

if ($nombre === '' || $telefono === '' || $email === '' || $mensaje === '') {
    responder(false, 'Faltan completar campos obligatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'El email no es válido.');
}

$subject = 'Contacto desde vetro.ar' . ($asunto !== '' ? ' — ' . $asunto : '');

$body  = "Nombre: $nombre\n";
$body .= 'Empresa: ' . ($empresa !== '' ? $empresa : '-') . "\n";
$body .= "Teléfono: $telefono\n";
$body .= "Email: $email\n\n";
$body .= $mensaje . "\n";

// El From debe ser del propio dominio para no chocar con filtros de spam;
// el Reply-To queda con el mail de quien escribió, para poder responderle directo.
$headers   = [];
$headers[] = 'From: Formulario Vetro <no-reply@vetro.ar>';
$headers[] = "Reply-To: $email";
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$enviado = mail($destino, $subject, $body, implode("\r\n", $headers));

if ($enviado) {
    responder(true, 'Mensaje enviado. Te respondemos en menos de 24hs hábiles.');
} else {
    responder(false, 'No se pudo enviar el mensaje. Intentá de nuevo o escribinos a ' . $destino . '.');
}
