import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Home,
  Users,
  Percent,
  DollarSign,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  UserPlus,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { housingApi, employeeApi } from '../../services/api.service';

interface HousingAssignment {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  rentDeductionAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
}

interface Housing {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  capacity: number;
  monthlyRent: number;
  description?: string;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  activeAssignments?: HousingAssignment[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export default function HousingsPage() {
  const [housings, setHousings] = useState<Housing[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHousing, setSelectedHousing] = useState<Housing | null>(null);
  
  // Modals & Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHousing, setNewHousing] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    capacity: 2,
    monthlyRent: 450,
    description: ''
  });

  const [assignment, setAssignment] = useState({
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    rentDeductionAmount: 450
  });

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const [housingRes, employeeRes] = await Promise.all([
        housingApi.getAll(),
        employeeApi.getAll()
      ]);
      
      const loadedHousings = housingRes.data as Housing[];
      setHousings(loadedHousings);
      
      // Filtrer les employés actifs pour le dropdown
      const allEmployees = employeeRes.data as Employee[];
      setEmployees(allEmployees.filter(e => e.status === 'ACTIVE'));

      // Sélectionner par défaut le premier hébergement ou conserver la sélection active
      if (loadedHousings.length > 0) {
        if (selectedHousing) {
          const updated = loadedHousings.find(h => h.id === selectedHousing.id);
          setSelectedHousing(updated || loadedHousings[0]);
        } else {
          setSelectedHousing(loadedHousings[0]);
        }
      } else {
        setSelectedHousing(null);
      }
    } catch (err: any) {
      toast.error('Erreur lors du chargement des données : ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mettre à jour le loyer par défaut dans le formulaire d'assignation
  useEffect(() => {
    if (selectedHousing) {
      setAssignment(prev => ({
        ...prev,
        rentDeductionAmount: selectedHousing.monthlyRent
      }));
    }
  }, [selectedHousing]);

  // Ajouter un hébergement
  const handleAddHousing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHousing.name || !newHousing.address || !newHousing.city || !newHousing.postalCode) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await housingApi.create(newHousing);
      toast.success('Hébergement créé avec succès !');
      setShowAddModal(false);
      setNewHousing({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        capacity: 2,
        monthlyRent: 450,
        description: ''
      });
      loadData();
    } catch (err: any) {
      toast.error('Erreur lors de la création : ' + (err.response?.data?.message || err.message));
    }
  };

  // Supprimer un hébergement
  const handleDeleteHousing = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet hébergement ?')) return;

    try {
      await housingApi.delete(id);
      toast.success('Hébergement supprimé avec succès !');
      loadData();
    } catch (err: any) {
      toast.error('Erreur lors de la suppression : ' + (err.response?.data?.message || err.message));
    }
  };

  // Assigner un employé
  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousing) return;
    if (!assignment.employeeId) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    try {
      await housingApi.assign(selectedHousing.id, assignment);
      toast.success('Employé logé avec succès !');
      setAssignment(prev => ({ ...prev, employeeId: '' }));
      loadData();
    } catch (err: any) {
      toast.error('Erreur d\'assignation : ' + (err.response?.data?.message || err.message));
    }
  };

  // Terminer un hébergement
  const handleTerminateAssignment = async (assignmentId: string) => {
    if (!window.confirm('Voulez-vous vraiment mettre fin au logement de cet employé ?')) return;

    try {
      await housingApi.terminate(assignmentId);
      toast.success('Logement terminé avec succès !');
      loadData();
    } catch (err: any) {
      toast.error('Erreur de résiliation : ' + (err.response?.data?.message || err.message));
    }
  };

  // Calculs KPI global
  const totalResidences = housings.length;
  const totalCapacity = housings.reduce((sum, h) => sum + h.capacity, 0);
  const totalOccupied = housings.reduce((sum, h) => sum + h.occupiedBeds, 0);
  const overallOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const projectedRevenue = housings.reduce((sum, h) => {
    const activeRent = h.activeAssignments?.reduce((s, a) => s + Number(a.rentDeductionAmount), 0) || 0;
    return sum + activeRent;
  }, 0);

  if (loading && housings.length === 0) {
    return (
      <div className="page flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="animate-spin" style={{ fontSize: '3rem' }}>🌀</div>
        <p className="mt-4 text-muted">Chargement de la gestion des hébergements...</p>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1>🏠 Gestion des Hébergements</h1>
          <p className="text-muted">Gérez et attribuez les logements meublés pour les employés et travailleurs saisonniers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Ajouter une résidence
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid-4 mb-4">
        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Total Résidences</span>
            <div style={{ color: 'var(--blue)', fontSize: '1.5rem' }}><Home size={24} /></div>
          </div>
          <h2>{totalResidences}</h2>
          <span className="text-xs text-muted">Logements sous gestion</span>
        </div>

        <div className="kpi-card text-success">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Lits Occupés</span>
            <div style={{ color: 'var(--green)', fontSize: '1.5rem' }}><Users size={24} /></div>
          </div>
          <h2>{totalOccupied} <span className="text-muted text-sm">/ {totalCapacity}</span></h2>
          <span className="text-xs text-muted">Capacité d'accueil globale</span>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Taux d'occupation</span>
            <div style={{ color: 'var(--yellow)', fontSize: '1.5rem' }}><Percent size={24} /></div>
          </div>
          <h2>{overallOccupancyRate}%</h2>
          <div className="w-full bg-surface0" style={{ height: '4px', borderRadius: '2px', marginTop: '4px' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${overallOccupancyRate}%`, 
                background: 'var(--yellow)',
                borderRadius: '2px' 
              }} 
            />
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Retenues sur paie</span>
            <div style={{ color: 'var(--mauve)', fontSize: '1.5rem' }}><DollarSign size={24} /></div>
          </div>
          <h2>{projectedRevenue.toFixed(2)} $</h2>
          <span className="text-xs text-muted">Revenu mensuel total collecté</span>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid-2 mt-4" style={{ gridTemplateColumns: '40% 60%', alignItems: 'start' }}>
        {/* Colonne Gauche : Liste des hébergements */}
        <div className="flex flex-col gap-4">
          <h3 className="mb-2 flex items-center gap-2">📂 Résidences disponibles</h3>
          {housings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏡</div>
              <p>Aucun hébergement configuré.</p>
              <p className="text-muted text-sm">Cliquez sur le bouton en haut pour ajouter votre première résidence.</p>
            </div>
          ) : (
            housings.map(housing => {
              const isSelected = selectedHousing?.id === housing.id;
              const isFull = housing.occupiedBeds >= housing.capacity;
              
              return (
                <div 
                  key={housing.id}
                  className={`card animate-fade-in`} 
                  style={{ 
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--surface0)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--mantle)',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedHousing(housing)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold" style={{ color: isSelected ? 'var(--primary-light)' : 'var(--text)' }}>
                        {housing.name}
                      </h4>
                      <p className="text-xs flex items-center gap-2 mt-1">
                        <MapPin size={12} className="text-primary" />
                        {housing.address}, {housing.city}
                      </p>
                    </div>
                    <span className={`badge ${isFull ? 'badge-error' : 'badge-success'}`}>
                      {isFull ? 'Complet' : `${housing.availableBeds} lit(s) libre(s)`}
                    </span>
                  </div>

                  {/* Progressive Capacity Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">Occupation</span>
                      <span className="font-semibold">{housing.occupiedBeds} / {housing.capacity} lits</span>
                    </div>
                    <div className="w-full bg-surface0" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${(housing.occupiedBeds / housing.capacity) * 100}%`, 
                          background: isFull ? 'var(--red)' : 'var(--green)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-2" style={{ borderTop: '1px dashed var(--surface0)' }}>
                    <span className="text-xs text-muted">Loyer mensuel par personne</span>
                    <span className="font-bold text-primary">{housing.monthlyRent.toFixed(2)} $</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Colonne Droite : Détail & Affectations */}
        <div>
          {selectedHousing ? (
            <div className="flex flex-col gap-6">
              {/* Détails du logement */}
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">Fiche de Résidence</span>
                    <h2>{selectedHousing.name}</h2>
                    <p className="text-sm flex items-center gap-2 mt-2">
                      <MapPin size={14} className="text-primary" />
                      {selectedHousing.address}, {selectedHousing.city} ({selectedHousing.postalCode})
                    </p>
                  </div>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHousing(selectedHousing.id);
                    }}
                    title="Supprimer la résidence"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
                
                {selectedHousing.description && (
                  <p className="text-sm bg-surface0" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
                    {selectedHousing.description}
                  </p>
                )}

                <div className="grid-3 mt-4" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1.5rem' }}>
                  <div>
                    <span className="text-xs text-muted block">Loyer Mensuel</span>
                    <span className="font-bold text-lg text-primary">{selectedHousing.monthlyRent.toFixed(2)} $</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Capacité Totale</span>
                    <span className="font-bold text-lg">{selectedHousing.capacity} Lits</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Taux d'occupation</span>
                    <span className={`font-bold text-lg ${selectedHousing.occupancyRate >= 100 ? 'text-error' : 'text-success'}`}>
                      {selectedHousing.occupancyRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Liste des occupants */}
              <div className="card">
                <h3 className="mb-4 flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Occupants Actuels ({selectedHousing.occupiedBeds})
                </h3>

                {selectedHousing.activeAssignments && selectedHousing.activeAssignments.length > 0 ? (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Début de logement</th>
                          <th>Déduction</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHousing.activeAssignments.map(assign => (
                          <tr key={assign.id}>
                            <td>
                              <div className="flex flex-col">
                                <span className="font-bold">
                                  {assign.employee?.firstName} {assign.employee?.lastName}
                                </span>
                                <span className="text-xs text-muted">{assign.employee?.email}</span>
                              </div>
                            </td>
                            <td>
                              <span className="flex items-center gap-2">
                                <Calendar size={14} className="text-muted" />
                                {new Date(assign.startDate).toLocaleDateString('fr-CA')}
                              </span>
                            </td>
                            <td>
                              <span className="font-bold text-primary">
                                {Number(assign.rentDeductionAmount).toFixed(2)} $
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleTerminateAssignment(assign.id)}
                                title="Terminer le logement"
                              >
                                <XCircle size={14} />
                                Libérer le lit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-surface0" style={{ borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', color: 'var(--overlay0)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--overlay1)' }} />
                    <p className="text-sm">Aucun occupant dans cette résidence actuellement.</p>
                  </div>
                )}
              </div>

              {/* Formulaire d'assignation */}
              {selectedHousing.occupiedBeds < selectedHousing.capacity && (
                <div className="card card-glass">
                  <h3 className="mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-primary" />
                    Loger un employé
                  </h3>
                  
                  <form onSubmit={handleAssignEmployee} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Employé à loger</label>
                      <select 
                        className="input" 
                        value={assignment.employeeId} 
                        onChange={(e) => setAssignment(prev => ({ ...prev, employeeId: e.target.value }))}
                      >
                        <option value="">-- Sélectionner un employé --</option>
                        {employees
                          .filter(emp => {
                            // Ne pas montrer les employés déjà logés dans cette résidence
                            const alreadyAssigned = selectedHousing.activeAssignments?.some(
                              a => a.employeeId === emp.id
                            );
                            return !alreadyAssigned;
                          })
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} ({emp.email})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="grid-2">
                      <div>
                        <label className="text-xs font-semibold text-muted block mb-1">Date d'arrivée</label>
                        <input 
                          type="date" 
                          className="input" 
                          value={assignment.startDate} 
                          onChange={(e) => setAssignment(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted block mb-1">Déduction retenue sur paie ($)</label>
                        <input 
                          type="number" 
                          className="input" 
                          min={0}
                          value={assignment.rentDeductionAmount} 
                          onChange={(e) => setAssignment(prev => ({ ...prev, rentDeductionAmount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary mt-2">
                      <UserPlus size={16} />
                      Attribuer le logement
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '6rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏡</div>
              <h3>Sélectionnez une résidence</h3>
              <p className="text-muted mt-2">Choisissez une résidence à gauche pour afficher ses occupants et assigner des lits.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL : Ajouter une résidence */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(17, 17, 27, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
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
              onClick={() => setShowAddModal(false)}
            >
              <X size={20} />
            </button>

            <h3 className="mb-4">🏠 Ajouter un nouvel hébergement</h3>
            
            <form onSubmit={handleAddHousing} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Nom de la résidence *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ex: Résidence des Pionniers A"
                  value={newHousing.name}
                  onChange={(e) => setNewHousing(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Adresse *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ex: 5678 Chemin Sainte-Foy"
                  value={newHousing.address}
                  onChange={(e) => setNewHousing(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Ville *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Ex: Québec"
                    value={newHousing.city}
                    onChange={(e) => setNewHousing(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Code Postal *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Ex: G1V 0A6"
                    value={newHousing.postalCode}
                    onChange={(e) => setNewHousing(prev => ({ ...prev, postalCode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Capacité (Lits) *</label>
                  <input 
                    type="number" 
                    className="input" 
                    min={1}
                    value={newHousing.capacity}
                    onChange={(e) => setNewHousing(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Loyer mensuel ($/personne) *</label>
                  <input 
                    type="number" 
                    className="input" 
                    min={0}
                    value={newHousing.monthlyRent}
                    onChange={(e) => setNewHousing(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Description / Notes</label>
                <textarea 
                  className="input" 
                  rows={3}
                  placeholder="Équipements inclus, commodités, etc."
                  value={newHousing.description}
                  onChange={(e) => setNewHousing(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer l'hébergement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
