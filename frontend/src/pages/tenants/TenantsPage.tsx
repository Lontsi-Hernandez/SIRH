import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Globe,
  Search,
  Plus,
  Building,
  Mail,
  User,
  Shield,
  Save,
  X,
  SlidersHorizontal,
  Info,
  Clock,
  ExternalLink,
  Trash2,
  Power,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../../services/api.service';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  website?: string;
  contactEmail: string;
  province: string;
  maxEmployees: number;
  isActive: boolean;
  subscriptionPlan: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [confirmNameInput, setConfirmNameInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: '',
    website: '',
    contactEmail: '',
    province: 'QC',
    maxEmployees: 100,
    adminFirstName: '',
    adminLastName: '',
    adminEmail: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Tenants
  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement des entreprises.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Form Input Handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name if not manually modified
      if (field === 'name' && !prev.slug) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.contactEmail || !formData.adminFirstName || !formData.adminLastName || !formData.adminEmail) {
      toast.error('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/tenants', formData);
      toast.success(`Entreprise "${formData.name}" créée avec succès ! Compte CEO activé. 🎉`);
      setShowAddDrawer(false);
      // Reset form
      setFormData({
        name: '',
        slug: '',
        industry: '',
        website: '',
        contactEmail: '',
        province: 'QC',
        maxEmployees: 100,
        adminFirstName: '',
        adminLastName: '',
        adminEmail: ''
      });
      loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de création de l\'entreprise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Activation Status
  const handleToggleStatus = async (tenant: Tenant) => {
    if (tenant.slug === 'system-admin') {
      toast.error("Impossible d'altérer l'entreprise d'administration générale.");
      return;
    }

    const nextStatus = !tenant.isActive;
    const loadingToast = toast.loading(`${nextStatus ? 'Activation' : 'Désactivation'} en cours...`);

    try {
      await apiClient.patch(`/tenants/${tenant.id}/status`, { isActive: nextStatus });
      toast.success(`Entreprise "${tenant.name}" ${nextStatus ? 'activée' : 'désactivée'} avec succès !`);
      loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut.');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Permanent Delete Handler
  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    if (confirmNameInput !== tenantToDelete.name) {
      toast.error("Le nom saisi ne correspond pas exactement.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(`Suppression définitive de ${tenantToDelete.name} et de ses données...`);

    try {
      await apiClient.delete(`/tenants/${tenantToDelete.id}`);
      toast.success(`Entreprise "${tenantToDelete.name}" et toutes ses données supprimées définitivement ! 🗑️`);
      setShowDeleteModal(false);
      setTenantToDelete(null);
      setConfirmNameInput('');
      loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression de l\'entreprise.');
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  // Filter Tenants (Excluding the system administration tenant itself from the client list)
  const filteredTenants = tenants.filter((t) => {
    if (t.slug === 'system-admin') return false; // Hide system tenant from client list
    
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.slug.toLowerCase().includes(term) ||
      (t.industry && t.industry.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>🌐 Gestion des Entreprises</h1>
          <p className="text-muted">Console d'administration générale de la plateforme SaaS HRMS</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)}>
          <Plus size={18} />
          Créer une entreprise
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid-3 mb-4">
        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Total Entreprises</span>
            <div style={{ color: 'var(--blue)' }}><Building size={24} /></div>
          </div>
          <h2>{tenants.length}</h2>
          <span className="text-xs text-muted">Locataires (Tenants) enregistrés</span>
        </div>

        <div className="kpi-card text-success">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Entreprises Actives</span>
            <div style={{ color: 'var(--green)' }}><Globe size={24} /></div>
          </div>
          <h2>{tenants.filter((t) => t.isActive).length}</h2>
          <span className="text-xs text-muted">Serveurs de production actifs</span>
        </div>

        <div className="kpi-card text-mauve">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Licences Allouées</span>
            <div style={{ color: 'var(--mauve)' }}><Shield size={24} /></div>
          </div>
          <h2>{tenants.reduce((acc, curr) => acc + (curr.maxEmployees || 0), 0)}</h2>
          <span className="text-xs text-muted">Capacité totale d'utilisateurs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4 flex justify-between items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-muted" size={18} />
          <input
            type="text"
            className="input w-full"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Rechercher une entreprise (nom, slug, email, secteur)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 text-xs text-muted items-center font-semibold">
          <SlidersHorizontal size={16} />
          <span>Filtres Actifs : Aucun</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse py-2" style={{ borderBottom: '1px solid var(--surface0)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface0" style={{ borderRadius: '6px' }} />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-surface0" style={{ width: '150px', borderRadius: '4px' }} />
                    <div className="h-3 bg-surface0" style={{ width: '220px', borderRadius: '4px' }} />
                  </div>
                </div>
                <div className="h-6 bg-surface0" style={{ width: '80px', borderRadius: '12px' }} />
              </div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--overlay0)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <h4>Aucune entreprise trouvée</h4>
            <p className="text-xs text-muted">Créez votre premier locataire en cliquant sur "Créer une entreprise".</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nom de l'Entreprise</th>
                  <th>Code (Slug)</th>
                  <th>Secteur / Province</th>
                  <th>Quota Employés</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center font-bold text-sm bg-primary text-white"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: tenant.slug === 'system-admin' ? 'var(--gradient-mauve)' : 'var(--gradient-primary)'
                          }}
                        >
                          {tenant.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-text">{tenant.name}</span>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock size={10} />
                            Inscrit le {new Date(tenant.createdAt).toLocaleDateString('fr-CA')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs block bg-surface0" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                        {tenant.slug}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{tenant.industry || 'N/A'}</span>
                        <span className="text-xs text-muted">Province : {tenant.province || 'QC'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">Max Quota</span>
                          <span className="font-semibold text-primary">{tenant.maxEmployees || 50}</span>
                        </div>
                        <div style={{ background: 'var(--surface0)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--gradient-primary)', width: '20%', height: '100%' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${tenant.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        ● {tenant.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      {tenant.slug !== 'system-admin' && (
                        <div className="flex justify-end gap-2">
                          <button
                            className={`btn btn-xs ${tenant.isActive ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(tenant)}
                            title={tenant.isActive ? "Désactiver l'entreprise" : "Activer l'entreprise"}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.7rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              height: '28px'
                            }}
                          >
                            <Power size={12} />
                            {tenant.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            className="btn btn-xs"
                            onClick={() => {
                              setTenantToDelete(tenant);
                              setShowDeleteModal(true);
                            }}
                            title="Supprimer définitivement"
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.7rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              height: '28px',
                              border: '1px solid var(--red)',
                              background: 'transparent',
                              color: 'var(--red)'
                            }}
                          >
                            <Trash2 size={12} />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER / SLIDE-PANEL : Créer une entreprise */}
      {showAddDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(17, 17, 27, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', height: '100vh', borderRadius: 0, overflowY: 'auto', position: 'relative' }}>
            <button
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
              onClick={() => setShowAddDrawer(false)}
            >
              <X size={20} />
            </button>

            <h3 className="mb-2">🏢 Enregistrer une entreprise (Tenant)</h3>
            <p className="text-xs text-muted mb-4">
              Créer un nouvel espace de travail isolé pour une organisation cliente.
            </p>

            <div className="bg-surface0 p-3 rounded-lg mb-4 flex items-center gap-2 text-xs text-primary">
              <Info size={16} />
              <span>Cette opération configure automatiquement le Siège Social et le compte CEO.</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* SECTION 1: L'ENTREPRISE */}
              <div style={{ borderBottom: '1px solid var(--surface0)', paddingBottom: '1rem' }}>
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">1. Informations de l'Entreprise</h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Nom de l'entreprise *</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Ex: Horizon Technologies Inc."
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="grid-2">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Code entreprise unique (Slug / Subdomain) *</label>
                      <input
                        type="text"
                        className="input w-full font-mono text-xs"
                        placeholder="Ex: horizon-tech"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Secteur d'activité</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Ex: Technologies, Commerce"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Province de siège social</label>
                      <select
                        className="input w-full"
                        value={formData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                      >
                        <option value="QC">Québec (QC)</option>
                        <option value="ON">Ontario (ON)</option>
                        <option value="BC">Colombie-Britannique (BC)</option>
                        <option value="AB">Alberta (AB)</option>
                        <option value="NS">Nouvelle-Écosse (NS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Quota Max Employés *</label>
                      <input
                        type="number"
                        className="input w-full"
                        min="1"
                        value={formData.maxEmployees}
                        onChange={(e) => handleInputChange('maxEmployees', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Email de contact global *</label>
                      <input
                        type="email"
                        className="input w-full"
                        placeholder="Ex: contact@entreprise.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Site Web (Optionnel)</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Ex: https://entreprise.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LE PREMIER CEO / ADMIN */}
              <div>
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">2. Administrateur Principal (CEO)</h4>
                <div className="flex flex-col gap-3">
                  <div className="grid-2">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Prénom du CEO *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Ex: Alice"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Nom de famille *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Ex: Gauthier"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Email de connexion du CEO *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-muted" size={16} />
                      <input
                        type="email"
                        className="input w-full"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Ex: alice.gauthier@entreprise.com"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      />
                    </div>
                    <span className="text-[10px] text-muted block mt-1">
                      Cet email servira d'identifiant pour la connexion de l'entreprise.
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 mt-6" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDrawer(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  <Save size={16} />
                  {isSubmitting ? 'Création en cours...' : 'Valider et Lancer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION MODAL FOR DELETE */}
      {showDeleteModal && tenantToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(17, 17, 27, 0.9)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--red)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertTriangle size={48} />
            </div>

            <h3 style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>⚠️ Danger : Suppression Définitive</h3>
            <p className="text-sm text-text mb-4">
              Vous êtes sur le point de supprimer définitivement l'entreprise <strong>{tenantToDelete.name}</strong>.
              <br />
              <span className="text-muted text-xs block mt-2" style={{ color: 'var(--red)', fontWeight: 600 }}>
                Cette action supprimera toutes les succursales, tous les comptes utilisateurs, plannings, feuilles de temps et dossiers d'employés liés. CETTE ACTION EST IRRÉVERSIBLE.
              </span>
            </p>

            <div className="mb-4 text-left">
              <label className="text-xs font-semibold text-muted block mb-1">
                Pour confirmer, veuillez saisir exactement le nom de l'entreprise : <strong>{tenantToDelete.name}</strong>
              </label>
              <input
                type="text"
                className="input w-full font-bold text-sm text-center"
                placeholder={tenantToDelete.name}
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
              />
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTenantToDelete(null);
                  setConfirmNameInput('');
                }}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: 'var(--red)',
                  color: 'white',
                  border: 'none',
                  opacity: confirmNameInput !== tenantToDelete.name ? 0.5 : 1,
                  cursor: confirmNameInput !== tenantToDelete.name ? 'not-allowed' : 'pointer'
                }}
                disabled={confirmNameInput !== tenantToDelete.name || isSubmitting}
                onClick={handleDeleteTenant}
              >
                {isSubmitting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
