import React, { useState, useRef, useEffect } from 'react';
import './ArcgisRenameItem.css';

/**
 * Editable text component for renaming folders and services
 * Supports double-click to edit, Enter to save, Esc to cancel
 */
function ArcgisRenameItem({
    value,
    onSave,
    onCancel,
    placeholder = 'Enter name...',
    className = '',
    isFolder = false,
    disabled = false
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef(null);

    // Reset edit value when value prop changes
    useEffect(() => {
        setEditValue(value);
    }, [value]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e) => {
        if (disabled) return;
        e.stopPropagation(); // Prevent triggering expand/collapse
        setIsEditing(true);
        setEditValue(value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== value) {
            onSave(trimmed);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
        if (onCancel) onCancel();
    };

    const handleBlur = () => {
        // Allow small delay to check if we're clicking on another element
        setTimeout(() => {
            if (isEditing) {
                handleCancel();
            }
        }, 100);
    };

    const handleChange = (e) => {
        setEditValue(e.target.value);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={`arcgis-rename-input ${className}`}
                maxLength={255}
            />
        );
    }

    return (
        <span
            className={`arcgis-rename-text ${className} ${disabled ? 'disabled' : ''}`}
            onDoubleClick={handleDoubleClick}
            title={disabled ? '' : 'Double-click to rename'}
        >
            {value}
        </span>
    );
}

export default ArcgisRenameItem;