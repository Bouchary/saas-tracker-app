// ============================================================================
// ASSET FORM PAGE - Création et édition AVEC ICÔNES LUCIDE-REACT
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Laptop, Smartphone, Monitor, Tablet, Keyboard, Box,
  ArrowLeft, Save, Edit, Plus,
  FileText, Wrench, DollarSign, MapPin, Tag
} from 'lucide-react';
import assetsApi from '../services/assetsApi';

const AssetFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    asset_type: 'laptop',
    manufacturer: '',
    model: '',
    serial_number: '',
    status: 'available',
    condition: 'new',
    purchase_date: '',
    purchase_price: '',
    currency: 'EUR',
    warranty_end_date: '',
    supplier: '',
    location: '',
    room: '',
    image_url: '',
    notes: '',
    // Spécifications (selon le type)
    spec_ram: '',
    spec_storage: '',
    spec_processor: '',
    spec_screen: '',
    spec_color: '',
    spec_network: '',
    spec_size: '',
    spec_resolution: '',
    spec_panel: '',
    spec_ports: ''
  });

  useEffect(() => {
    if (isEditMode) {
      loadAsset();
    }
  }, [id]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await assetsApi.getById(id);
      const asset = data.asset;
      
      // Mapper les données de l'asset au formulaire
      setFormData({
        asset_tag: asset.asset_tag || '',
        name: asset.name || '',
        asset_type: asset.asset_type || 'laptop',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        status: asset.status || 'available',
        condition: asset.condition || 'new',
        purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
        purchase_price: asset.purchase_price || '',
        currency: asset.currency || 'EUR',
        warranty_end_date: asset.warranty_end_date ? asset.warranty_end_date.split('T')[0] : '',
        supplier: asset.supplier || '',
        location: asset.location || '',
        room: asset.room || '',
        image_url: asset.image_url || '',
        notes: asset.notes || '',
        // Spécifications
        spec_ram: asset.specifications?.ram || '',
        spec_storage: asset.specifications?.storage || '',
        spec_processor: asset.specifications?.processor || '',
        spec_screen: asset.specifications?.screen || '',
        spec_color: asset.specifications?.color || '',
        spec_network: asset.specifications?.network || '',
        spec_size: asset.specifications?.size || '',
        spec_resolution: asset.specifications?.resolution || '',
        spec_panel: asset.specifications?.panel || '',
        spec_ports: asset.specifications?.ports || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const buildSpecifications = () => {
    const specs = {};
    
    // Ajouter les specs selon le type
    if (formData.asset_type === 'laptop') {
      if (formData.spec_ram) specs.ram = formData.spec_ram;
      if (formData.spec_storage) specs.storage = formData.spec_storage;
      if (formData.spec_processor) specs.processor = formData.spec_processor;
      if (formData.spec_screen) specs.screen = formData.spec_screen;
    } else if (formData.asset_type === 'phone') {
      if (formData.spec_storage) specs.storage = formData.spec_storage;
      if (formData.spec_color) specs.color = formData.spec_color;
      if (formData.spec_network) specs.network = formData.spec_network;
    } else if (formData.asset_type === 'monitor') {
      if (formData.spec_size) specs.size = formData.spec_size;
      if (formData.spec_resolution) specs.resolution = formData.spec_resolution;
      if (formData.spec_panel) specs.panel = formData.spec_panel;
      if (formData.spec_ports) specs.ports = formData.spec_ports;
    } else if (formData.asset_type === 'tablet') {
      if (formData.spec_storage) specs.storage = formData.spec_storage;
      if (formData.spec_screen) specs.screen = formData.spec_screen;
      if (formData.spec_color) specs.color = formData.spec_color;
    }
    
    return Object.keys(specs).length > 0 ? specs : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const assetData = {
        asset_tag: formData.asset_tag,
        name: formData.name,
        asset_type: formData.asset_type,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        status: formData.status,
        condition: formData.condition,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        currency: formData.currency,
        warranty_end_date: formData.warranty_end_date || null,
        supplier: formData.supplier,
        location: formData.location,
        room: formData.room,
        image_url: formData.image_url,
        notes: formData.notes,
        specifications: buildSpecifications()
      };

      if (isEditMode) {
        await assetsApi.update(id, assetData);
        alert('Asset modifié avec succès !');
        navigate(`/assets/${id}`);
      } else {
        const result = await assetsApi.create(assetData);
        alert('Asset créé avec succès !');
        navigate(`/assets/${result.asset.id}`);
      }
    } catch (err) {
      setError(err.message);
      alert('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificationFields = () => {
    switch (formData.asset_type) {
      case 'laptop':
        return (
          <>
            <div className="form-group">
              <label>RAM</label>
              <input
                type="text"
                name="spec_ram"
                value={formData.spec_ram}
                onChange={handleChange}
                placeholder="Ex: 16GB, 32GB"
              />
            </div>
            <div className="form-group">
              <label>Stockage</label>
              <input
                type="text"
                name="spec_storage"
                value={formData.spec_storage}
                onChange={handleChange}
                placeholder="Ex: 512GB SSD, 1TB SSD"
              />
            </div>
            <div className="form-group">
              <label>Processeur</label>
              <input
                type="text"
                name="spec_processor"
                value={formData.spec_processor}
                onChange={handleChange}
                placeholder="Ex: M2 Pro, i7-1270P"
              />
            </div>
            <div className="form-group">
              <label>Écran</label>
              <input
                type="text"
                name="spec_screen"
                value={formData.spec_screen}
                onChange={handleChange}
                placeholder="Ex: 16 inch, 14 inch 4K"
              />
            </div>
          </>
        );
      
      case 'phone':
        return (
          <>
            <div className="form-group">
              <label>Stockage</label>
              <input
                type="text"
                name="spec_storage"
                value={formData.spec_storage}
                onChange={handleChange}
                placeholder="Ex: 128GB, 256GB"
              />
            </div>
            <div className="form-group">
              <label>Couleur</label>
              <input
                type="text"
                name="spec_color"
                value={formData.spec_color}
                onChange={handleChange}
                placeholder="Ex: Space Gray, Phantom Black"
              />
            </div>
            <div className="form-group">
              <label>Réseau</label>
              <input
                type="text"
                name="spec_network"
                value={formData.spec_network}
                onChange={handleChange}
                placeholder="Ex: 5G, 4G LTE"
              />
            </div>
          </>
        );
      
      case 'monitor':
        return (
          <>
            <div className="form-group">
              <label>Taille</label>
              <input
                type="text"
                name="spec_size"
                value={formData.spec_size}
                onChange={handleChange}
                placeholder="Ex: 27 inch, 32 inch"
              />
            </div>
            <div className="form-group">
              <label>Résolution</label>
              <input
                type="text"
                name="spec_resolution"
                value={formData.spec_resolution}
                onChange={handleChange}
                placeholder="Ex: 4K, 5K, 1080p"
              />
            </div>
            <div className="form-group">
              <label>Type de dalle</label>
              <input
                type="text"
                name="spec_panel"
                value={formData.spec_panel}
                onChange={handleChange}
                placeholder="Ex: IPS, OLED"
              />
            </div>
            <div className="form-group">
              <label>Ports</label>
              <input
                type="text"
                name="spec_ports"
                value={formData.spec_ports}
                onChange={handleChange}
                placeholder="Ex: HDMI, USB-C, DisplayPort"
              />
            </div>
          </>
        );
      
      case 'tablet':
        return (
          <>
            <div className="form-group">
              <label>Stockage</label>
              <input
                type="text"
                name="spec_storage"
                value={formData.spec_storage}
                onChange={handleChange}
                placeholder="Ex: 256GB, 512GB"
              />
            </div>
            <div className="form-group">
              <label>Écran</label>
              <input
                type="text"
                name="spec_screen"
                value={formData.spec_screen}
                onChange={handleChange}
                placeholder="Ex: 12.9 inch, 11 inch"
              />
            </div>
            <div className="form-group">
              <label>Couleur</label>
              <input
                type="text"
                name="spec_color"
                value={formData.spec_color}
                onChange={handleChange}
                placeholder="Ex: Silver, Space Gray"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="asset-form-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        <h1>
          {isEditMode ? (
            <>
              <Edit className="w-6 h-6 inline mr-2" />
              Modifier un asset
            </>
          ) : (
            <>
              <Plus className="w-6 h-6 inline mr-2" />
              Nouvel asset
            </>
          )}
        </h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="asset-form">
        {/* Section 1: Informations de base */}
        <div className="form-section">
          <h2>
            <FileText className="w-5 h-5 inline mr-2" />
            Informations de base
          </h2>
          
          <div className="form-row">
            <div className="form-group required">
              <label>Asset Tag *</label>
              <input
                type="text"
                name="asset_tag"
                value={formData.asset_tag}
                onChange={handleChange}
                required
                placeholder="Ex: LAP-001, PHO-015"
                disabled={isEditMode}
              />
              <small>Identifiant unique (ne peut pas être modifié)</small>
            </div>

            <div className="form-group required">
              <label>Type *</label>
              <select
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                required
              >
                <option value="laptop">Laptop</option>
                <option value="phone">Phone</option>
                <option value="monitor">Monitor</option>
                <option value="tablet">Tablet</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group required">
            <label>Nom *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ex: MacBook Pro 16\" M2
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fabricant</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Ex: Apple, Dell, Lenovo"
              />
            </div>

            <div className="form-group">
              <label>Modèle</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Ex: MacBook Pro 16-inch 2023"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Numéro de série</label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              placeholder="Numéro de série unique"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Disponible</option>
                <option value="assigned">Assigné</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retiré</option>
                <option value="lost">Perdu</option>
              </select>
            </div>

            <div className="form-group">
              <label>Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="new">Neuf</option>
                <option value="good">Bon</option>
                <option value="fair">Moyen</option>
                <option value="poor">Mauvais</option>
                <option value="damaged">Endommagé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Spécifications */}
        <div className="form-section">
          <h2>
            <Wrench className="w-5 h-5 inline mr-2" />
            Spécifications techniques
          </h2>
          <div className="form-row">
            {renderSpecificationFields()}
          </div>
        </div>

        {/* Section 3: Informations d'achat */}
        <div className="form-section">
          <h2>
            <DollarSign className="w-5 h-5 inline mr-2" />
            Informations d'achat
          </h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date d'achat</label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Prix d'achat</label>
              <div className="input-group">
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="currency-select"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fin de garantie</label>
              <input
                type="date"
                name="warranty_end_date"
                value={formData.warranty_end_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Fournisseur</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Localisation */}
        <div className="form-section">
          <h2>
            <MapPin className="w-5 h-5 inline mr-2" />
            Localisation
          </h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Paris HQ, Lyon Office"
              />
            </div>

            <div className="form-group">
              <label>Salle</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="Ex: IT Room, Meeting Room A"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Autres */}
        <div className="form-section">
          <h2>
            <FileText className="w-5 h-5 inline mr-2" />
            Informations complémentaires
          </h2>
          
          <div className="form-group">
            <label>URL de l'image</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Notes additionnelles..."
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save className="w-4 h-4 inline mr-1" />
            {loading ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetFormPage;