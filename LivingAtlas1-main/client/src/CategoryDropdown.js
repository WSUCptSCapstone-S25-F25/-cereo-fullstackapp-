import React, { useState, useRef, useEffect } from 'react';
import './CategoryDropdown.css';

const CATEGORIES = [
  { value: 'River', label: 'River' },
  { value: 'Watershed', label: 'Watershed' },
  { value: 'Places', label: 'Places' }
];

function CategoryDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(value ? [value] : []);
  const dropdownRef = useRef(null);

  // Update selectedCategories when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedCategories([value]);
    } else {
      setSelectedCategories([]);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggleCategory = (categoryValue) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryValue)) {
        return prev.filter((c) => c !== categoryValue);
      } else {
        // Only allow single selection
        return [categoryValue];
      }
    });
  };

  const handleApply = () => {
    const selectedValue = selectedCategories.length > 0 ? selectedCategories[0] : '';
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedCategories([]);
    onChange('');
    setIsOpen(false);
  };

  const displayText = selectedCategories.length > 0 ? selectedCategories[0] : 'Category';

  return (
    <div className="category-dropdown" ref={dropdownRef}>
      <button
        className="category-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Select category"
      >
        {displayText}
      </button>

      {isOpen && (
        <div className="category-dropdown-menu">
          <div className="category-dropdown-options">
            {CATEGORIES.map((category) => (
              <label key={category.value} className="category-option">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.value)}
                  onChange={() => handleToggleCategory(category.value)}
                  className="category-checkbox"
                />
                <span className="category-label">{category.label}</span>
              </label>
            ))}
          </div>

          <div className="category-dropdown-footer">
            <button
              className="category-dropdown-btn clear"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className="category-dropdown-btn apply"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDropdown;
