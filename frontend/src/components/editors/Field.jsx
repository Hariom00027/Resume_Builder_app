import React, { useState, useEffect } from 'react';

// Bug 2.1 fixed: listItems local state now re-syncs whenever the `value` prop changes.
export function Field({ label, type = 'text', value, onChange, onBlur, placeholder, required, description, children }) {
  const parseList = (v) =>
    Array.isArray(v) ? v : (v || '').split(',').map((s) => s.trim()).filter(Boolean);

  const [listItems, setListItems] = useState(() => parseList(value));

  // Keep local list in sync when the parent provides a new value (e.g. after a save round-trip)
  useEffect(() => {
    if (type === 'list') {
      setListItems(parseList(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type]);

  const handleListChange = (newItems) => {
    setListItems(newItems);
    onChange(newItems.join(', '));
  };

  const addListItem = () => {
    handleListChange([...listItems, '']);
  };

  const updateListItem = (index, newValue) => {
    const updated = [...listItems];
    updated[index] = newValue;
    handleListChange(updated);
  };

  const removeListItem = (index) => {
    const updated = listItems.filter((_, i) => i !== index);
    handleListChange(updated);
  };

  if (children) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        {children}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        <div className="space-y-2">
          {listItems.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateListItem(idx, e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder || `Item ${idx + 1}`}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removeListItem(idx)}
                className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addListItem}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add item
          </button>
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>
    );
  }

  if (type === 'image') {
    const handleImageChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target.result);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
      };
      reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
      onChange('');
    };

    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        <div className="space-y-2">
          {value ? (
            <div className="relative inline-block">
              <img
                src={value}
                alt="Profile"
                className="max-w-full h-auto max-h-32 rounded border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">No image selected</p>
            </div>
          )}
          <label className="block">
            <span className="text-sm bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 inline-block">
              {value ? 'Change Image' : 'Upload Image'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`w-full border rounded px-3 py-2 ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`w-full border rounded px-3 py-2 ${props.className || ''}`} />;
}

export function SmallButton({ variant = 'gray', ...props }) {
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900';

  return (
    <button
      type="button"
      {...props}
      className={`px-3 py-1.5 rounded text-sm font-medium ${styles} ${props.className || ''}`}
    />
  );
}
