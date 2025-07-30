<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dompdf\Dompdf;

require 'vendor/autoload.php';
require_once '../db.php';

// Generate PDF
$dompdf = new Dompdf();
$dompdf->loadHtml("<h1>Student Academic Report</h1><p>This is a test report</p>");
$dompdf->setPaper('A4');
$dompdf->render();
$pdf = $dompdf->output();

// Save to file or attach directly
file_put_contents("report.pdf", $pdf);

// Send email
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com'; // Your SMTP
    $mail->SMTPAuth = true;
    $mail->Username = 'your-email@gmail.com';
    $mail->Password = 'your-email-password-or-app-password';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('your-email@gmail.com', 'Tution System');
    $mail->addAddress('recipient@example.com');
    $mail->addAttachment('report.pdf');

    $mail->isHTML(true);
    $mail->Subject = 'Your Report';
    $mail->Body = 'Hi, please find your academic report attached.';

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => "Email failed: {$mail->ErrorInfo}"]);
}
?>
