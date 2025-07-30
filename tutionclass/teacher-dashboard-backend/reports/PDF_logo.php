<?php
require 'vendor/autoload.php';
require_once '../db.php';

use Dompdf\Dompdf;

$studentId = $_GET['student_id'] ?? null;
$reportType = $_GET['type'] ?? 'academic';

if (!$studentId) {
    die("Missing student ID");
}

$logo = 'https://www.freepik.com/free-vector/colorful-bird-illustration-gradient_31530356.htm#fromView=keyword&page=1&position=1&uuid=9e04d10c-0e06-47c7-97b8-730f368ffd0d&query=Logo'; // Replace with your logo URL

// Fetch data
if ($reportType === 'academic') {
    $stmt = $conn->prepare("SELECT subject, mark, term, year FROM marks WHERE student_id = ?");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = $result->fetch_all(MYSQLI_ASSOC);

    $tableRows = '';
    foreach ($rows as $row) {
        $tableRows .= "<tr>
            <td>{$row['subject']}</td>
            <td>{$row['mark']}</td>
            <td>{$row['term']}</td>
            <td>{$row['year']}</td>
        </tr>";
    }

    $html = "
    <style>
        body { font-family: Arial; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: center; }
        img.logo { height: 80px; width: 80px; margin-bottom: 20px; }
    </style>

    <div style='text-align:center;'>
        <img src='$logo' class='logo' alt='Logo'><br>
        <h1>Academic Report</h1>
    </div>

    <table>
        <tr><th>Subject</th><th>Mark</th><th>Term</th><th>Year</th></tr>
        $tableRows
    </table>";
}

$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->setPaper('A4');
$dompdf->render();

// Download PDF
$dompdf->stream("report_$reportType.pdf", ["Attachment" => 1]);
?>
