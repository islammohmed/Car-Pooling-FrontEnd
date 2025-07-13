import { Injectable } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  
  constructor() {}

  /**
   * Opens a Bootstrap modal by its ID
   * @param modalId The ID of the modal element
   * @returns The Bootstrap modal instance or null if not found
   */
  open(modalId: string): any {
    try {
      const modalElement = document.getElementById(modalId);
      if (!modalElement) {
        console.error(`Modal with ID ${modalId} not found`);
        return null;
      }
      
      // Check if Bootstrap is loaded
      if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.error('Bootstrap JavaScript is not loaded');
        return null;
      }
      
      // Try to get existing instance or create new one
      let modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalElement);
      }
      
      modalInstance.show();
      return modalInstance;
    } catch (error) {
      console.error('Error opening modal:', error);
      return null;
    }
  }

  /**
   * Closes a Bootstrap modal by its ID
   * @param modalId The ID of the modal element
   * @returns true if successful, false otherwise
   */
  close(modalId: string): boolean {
    try {
      const modalElement = document.getElementById(modalId);
      if (!modalElement) {
        console.error(`Modal with ID ${modalId} not found`);
        return false;
      }
      
      // Check if Bootstrap is loaded
      if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.error('Bootstrap JavaScript is not loaded');
        return false;
      }
      
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error closing modal:', error);
      return false;
    }
  }
} 