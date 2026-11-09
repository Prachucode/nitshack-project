import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileCode2, 
  Check, 
  X, 
  Hash,
  Calendar,
  Type as TypeIcon
} from 'lucide-react';

export default function CertificateTypes() {
    const defaults = [
        { 
            id: 1, 
            name: "University Degree", 
            fields: [
                { name: "Issuing Authority Name", type: "text" },
                { name: "Course", type: "text" },
                { name: "Major", type: "text" },
                { name: "GPA", type: "number" },
                { name: "Completion Date", type: "date" }
            ] 
        },
        { 
            id: 2, 
            name: "Skill Certificate", 
            fields: [
                { name: "Skill Name", type: "text" },
                { name: "Level", type: "text" },
                { name: "Hours", type: "number" }
            ] 
        }
    ];

    const [types, setTypes] = useState(() => {
        const savedTypes = localStorage.getItem('certTemplates');
        const templateVersion = localStorage.getItem('templateVersion');
        
        if (!savedTypes || templateVersion !== '1.1') {
            localStorage.setItem('certTemplates', JSON.stringify(defaults));
            localStorage.setItem('templateVersion', '1.1');
            return defaults;
        }
        try {
            return JSON.parse(savedTypes);
        } catch {
            return defaults;
        }
    });

    const [newTypeName, setNewTypeName] = useState("");
    const [newTypeFields, setNewTypeFields] = useState([{ name: "", type: "text" }]);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddField = () => {
        setNewTypeFields([...newTypeFields, { name: "", type: "text" }]);
    };

    const handleFieldChange = (index, key, value) => {
        const updatedFields = [...newTypeFields];
        updatedFields[index][key] = value;
        setNewTypeFields(updatedFields);
    };

    const handleRemoveField = (index) => {
        const updatedFields = newTypeFields.filter((_, i) => i !== index);
        setNewTypeFields(updatedFields);
    };

    const handleSaveType = () => {
        if (!newTypeName.trim()) return alert("Please enter a schema type name");
        if (newTypeFields.some(f => !f.name.trim())) return alert("All fields must have a valid attribute name");

        const newType = {
            id: Date.now(),
            name: newTypeName.trim(),
            fields: newTypeFields
        };

        const updatedTypes = [...types, newType];
        setTypes(updatedTypes);
        localStorage.setItem('certTemplates', JSON.stringify(updatedTypes));
        
        // Reset form
        setNewTypeName("");
        setNewTypeFields([{ name: "", type: "text" }]);
        setShowAddForm(false);
    };

    const handleDeleteType = (id) => {
        if (window.confirm("Delete this template? Existing credentials won't be affected.")) {
            const updatedTypes = types.filter(t => t.id !== id);
            setTypes(updatedTypes);
            localStorage.setItem('certTemplates', JSON.stringify(updatedTypes));
        }
    };

    const getFieldTypeIcon = (type) => {
        switch(type) {
            case 'number': return <Hash size={13} className="field-badge-icon" />;
            case 'date': return <Calendar size={13} className="field-badge-icon" />;
            default: return <TypeIcon size={13} className="field-badge-icon" />;
        }
    };

    return (
        <div className="certificate-types-container">
            <div className="form-wrapper max-width-1100">
                {/* Header */}
                <div className="form-header text-center">
                    <h1 className="form-title">Certificate Schemas</h1>
                    <p className="form-subtitle">
                        Manage certificate templates and their fields
                    </p>
                </div>

                <div className="form-content">
                    {!showAddForm ? (
                        <div className="types-list-view">
                            <div className="schemas-toolbar">
                                <div className="schemas-counter">
                                    <span className="counter-dot"></span>
                                    <span><strong>{types.length}</strong> Templates</span>
                                </div>
                                <button 
                                    onClick={() => setShowAddForm(true)}
                                    className="add-type-button"
                                >
                                    <Plus size={18} />
                                    <span>New Template</span>
                                </button>
                            </div>

                            <div className="types-grid">
                                {types.map(type => (
                                    <div key={type.id} className="type-card">
                                        <div className="type-card-header">
                                            <div className="schema-title-group">
                                                <div className="schema-icon-box">
                                                    <FileCode2 size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="schema-name">{type.name}</h3>
                                                    <span className="schema-fields-count">
                                                        {type.fields.length} {type.fields.length === 1 ? 'attribute' : 'attributes'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteType(type.id)}
                                                className="delete-icon"
                                                title="Delete Schema"
                                                aria-label="Delete Schema"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="type-fields">
                                            <p className="fields-label">Fields:</p>
                                            <div className="fields-badge-list">
                                                {type.fields.map((field, idx) => (
                                                    <div key={idx} className="field-tag-pill">
                                                        {getFieldTypeIcon(field.type)}
                                                        <span className="field-name">{field.name}</span>
                                                        <span className="field-type-chip">{field.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="add-type-form-container">
                            <div className="form-panel-header">
                                <div>
                                    <h3 className="panel-title">New Template</h3>
                                    <p className="panel-subtitle">Define fields for this credential type</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddForm(false)} 
                                    className="icon-close-btn"
                                    aria-label="Close form"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span>Template Name</span>
                                    <span className="required-star">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="e.g., Master of Science, Internship Fellowship, Hackathon Winner"
                                    className="text-input"
                                    autoFocus
                                />
                            </div>

                            <div className="fields-section">
                                <div className="fields-section-header">
                                    <label className="form-label">Fields</label>
                                    <span className="fields-hint">Define fields like GPA, Major, Hours, or Expiry</span>
                                </div>

                                <div className="field-rows-container">
                                    {newTypeFields.map((field, index) => (
                                        <div key={index} className="field-row">
                                            <div className="field-name-wrap">
                                                <input 
                                                    type="text" 
                                                    value={field.name}
                                                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                                    placeholder="Attribute Name (e.g. Major, Final Score)"
                                                    className="field-input"
                                                />
                                            </div>
                                            <div className="field-type-wrap">
                                                <select 
                                                    value={field.type}
                                                    onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                                                    className="field-select"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveField(index)}
                                                className="remove-field-btn"
                                                disabled={newTypeFields.length === 1}
                                                title="Remove field"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleAddField} className="add-field-btn">
                                    <Plus size={16} />
                                    <span>Add Field</span>
                                </button>
                            </div>

                            <div className="form-actions-bar">
                                <button 
                                    onClick={() => setShowAddForm(false)}
                                    className="cancel-button"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveType}
                                    className="save-button"
                                >
                                    <Check size={16} />
                                    <span>Save Template</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
