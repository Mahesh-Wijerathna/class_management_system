<?php
require_once __DIR__ . '/../Database.php';

class Mark {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getByExamId($exam_id) {
        $stmt = $this->db->prepare("
            SELECT m.*, qp.label, qp.max_marks
            FROM marks m
            JOIN question_parts qp ON m.question_part_id = qp.part_id
            WHERE qp.exam_id = ?
        ");
        $stmt->execute([$exam_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveBulk($exam_id, $marks) {
        $this->db->beginTransaction();
        try {
            foreach ($marks as $mark) {
                $stmt = $this->db->prepare("
                    INSERT INTO marks (student_identifier, question_part_id, score_awarded)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE score_awarded = VALUES(score_awarded)
                ");
                $stmt->execute([$mark['student_identifier'], $mark['question_part_id'], $mark['score_awarded']]);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
?>