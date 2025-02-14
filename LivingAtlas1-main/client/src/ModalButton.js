import React, { useState } from 'react';
import Modal from 'react-modal';
import './ModalButton.css';


const ModalButton = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const handleButtonClick = () => {
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    return (
        <div className="modal-button">
            <button onClick={handleButtonClick}>Open Modal</button>
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal-content">
                <h2>Modal Content</h2>
                <p>This is the content of the modal.</p>
                <button onClick={closeModal} className="modal-close-button">&times;</button>
            </Modal>
        </div>


    );
};

export default ModalButton;
