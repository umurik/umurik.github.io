<?php
// Приём заявок с формы и отправка на почту заказчика. Нужен хостинг с PHP и работающей функцией mail().
declare(strict_types=1);

const LEAD_EMAIL = '407919@mail.ru';

header('Content-Type: application/json; charset=utf-8');

function reply(bool $ok, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => $ok]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(false, 405);
}

$raw = file_get_contents('php://input', false, null, 0, 10000);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    reply(false, 400);
}

$clean = static function ($value, int $max): string {
    $value = is_string($value) ? $value : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    return trim(mb_substr(strip_tags($value), 0, $max));
};

// Скрытое поле-ловушка: люди его не видят, боты заполняют
if ($clean($data['website'] ?? '', 100) !== '') {
    reply(true);
}

$name = $clean($data['name'] ?? '', 100);
$phone = $clean($data['phone'] ?? '', 30);
$digits = preg_replace('/\D/', '', $phone) ?? '';

if ($name === '' || strlen($digits) < 11) {
    reply(false, 422);
}

$lines = [
    'Новая заявка с сайта',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
];

$utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
$utm = is_array($data['utm'] ?? null) ? $data['utm'] : [];
$utmLines = [];
foreach ($utmKeys as $key) {
    $val = $clean($utm[$key] ?? '', 200);
    if ($val !== '') {
        $utmLines[] = $key . ': ' . $val;
    }
}
if ($utmLines) {
    $lines[] = '';
    $lines[] = 'Источник рекламы:';
    array_push($lines, ...$utmLines);
}

$lines[] = '';
$lines[] = 'Отправлено: ' . date('d.m.Y H:i');

$host = preg_replace('/[^a-z0-9.\-]/i', '', (string)($_SERVER['SERVER_NAME'] ?? 'localhost')) ?: 'localhost';
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';
$headers = implode("\r\n", [
    'From: =?UTF-8?B?' . base64_encode('Заявки с сайта') . '?= <noreply@' . $host . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail(LEAD_EMAIL, $subject, implode("\n", $lines), $headers);
reply($sent, $sent ? 200 : 500);
