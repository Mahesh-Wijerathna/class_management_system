<?php

require_once 'ClassModel.php';
require_once 'config.php';

class ClassController {
    private $model;

    public function __construct($db) {
        $this->model = new ClassModel($db);
    }

    // Create class
    public function createClass($data) {
        return $this->model->createClass($data);
    }

    // Get class by ID
    public function getClassById($id) {
        return $this->model->getClassById($id);
    }

    // Update class by ID
    public function updateClass($id, $data) {
        return $this->model->updateClass($id, $data);
    }

    // Delete class by ID
    public function deleteClass($id) {
        return $this->model->deleteClass($id);
    }

    // Get all classes
    public function getAllClasses() {
        return $this->model->getAllClasses();
    }

    // Get active classes only
    public function getActiveClasses() {
        return $this->model->getActiveClasses();
    }

    // Get classes by course type
    public function getClassesByType($courseType) {
        return $this->model->getClassesByType($courseType);
    }

    // Get classes by delivery method
    public function getClassesByDeliveryMethod($deliveryMethod) {
        return $this->model->getClassesByDeliveryMethod($deliveryMethod);
    }
}