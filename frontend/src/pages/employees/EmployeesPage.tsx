import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  SlidersHorizontal,
  Briefcase,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Archive,
  Play,
  Pause,
  FileText,
  Trash2,
  X,
  Save,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  onboardEmployee,
  offboardEmployee,
  setSelected,
  clearError,
  Employee
} from '../../store/slices/employeeSlice';

export default function EmployeesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, selected, total, totalPages, currentPage, isLoading, error } = useSelector(
    (state: RootState) => state.employees
  );

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Panels State
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState<Employee | null>(null);

  // Form States
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE',
    hireDate: new Date().toISOString().split('T')[0],
    annualSalary: 50000,
    hourlyRate: 25,
    customAttributes: {} as Record<string, any>
  });

  const [offboardForm, setOffboardForm] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // RESTORE DRAFT FORM FROM LOCALSTORAGE (Rule 2: Auto-save Drafts)
  useEffect(() => {
    const savedDraft = localStorage.getItem('sirh_employee_creation_draft');
    if (savedDraft) {
      try {
        setNewEmployee(JSON.parse(savedDraft));
        toast.success('Brouillon de formulaire restauré ! 📝');
      } catch (e) {
        console.error('Erreur de chargement du brouillon', e);
      }
    }
  }, []);

  // AUTO-SAVE DRAFT TO LOCALSTORAGE (Rule 2: Auto-save Drafts)
  const handleInputChange = (field: string, value: any) => {
    const updated = { ...newEmployee, [field]: value };
    setNewEmployee(updated);
    localStorage.setItem('sirh_employee_creation_draft', JSON.stringify(updated));
  };

  const handleCustomAttributeChange = (key: string, value: any) => {
    const updatedAttributes = { ...newEmployee.customAttributes, [key]: value };
    const updated = { ...newEmployee, customAttributes: updatedAttributes };
    setNewEmployee(updated);
    localStorage.setItem('sirh_employee_creation_draft', JSON.stringify(updated));
  };

  const clearCreationDraft = () => {
    localStorage.removeItem('sirh_employee_creation_draft');
    setNewEmployee({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'EMPLOYEE',
      hireDate: new Date().toISOString().split('T')[0],
      annualSalary: 50000,
      hourlyRate: 25,
      customAttributes: {}
    });
  };

  // Fetch Employees on Filters change
  useEffect(() => {
    dispatch(
      fetchEmployees({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      })
    );
  }, [dispatch, page, searchTerm, statusFilter, roleFilter]);

  // Handle Errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email) {
      toast.error('Veuillez remplir les informations obligatoires (Prénom, Nom, Email)');
      return;
    }

    try {
      await dispatch(createEmployee(newEmployee)).unwrap();
      toast.success('Fiche employé créée avec succès en tant que DRAFT ! 💼');
      setShowAddDrawer(false);
      clearCreationDraft();
    } catch (err: any) {
      toast.error(err || 'Erreur lors de la création');
    }
  };

  // Transition: Onboard (DRAFT -> ACTIVE)
  const handleOnboard = async (id: string) => {
    if (!window.confirm('Voulez-vous valider et lancer l\'onboarding de cet employé ? Son statut passera à ACTIVE.')) return;
    try {
      await dispatch(onboardEmployee(id)).unwrap();
      toast.success('Employé activé et onboardé avec succès ! 🎉');
      dispatch(fetchEmployees({ page }));
      dispatch(setSelected(null)); // Refresh drawer
    } catch (err: any) {
      toast.error(err || 'Erreur d\'onboarding');
    }
  };

  // Transition: Offboard (ACTIVE -> TERMINATED)
  const handleOffboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offboardTarget) return;
    if (!offboardForm.reason) {
      toast.error('Veuillez spécifier la raison du départ.');
      return;
    }

    try {
      await dispatch(
        offboardEmployee({
          id: offboardTarget.id,
          terminationDate: offboardForm.terminationDate,
          reason: offboardForm.reason
        })
      ).unwrap();
      toast.success('Offboarding validé. Employé marqué comme TERMINATED 🚪');
      setShowOffboardModal(false);
      setOffboardTarget(null);
      setOffboardForm({
        terminationDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      dispatch(setSelected(null)); // Refresh drawer
      dispatch(fetchEmployees({ page }));
    } catch (err: any) {
      toast.error(err || 'Erreur d\'offboarding');
    }
  };

  // Transition: Suspend (ACTIVE -> SUSPENDED)
  const handleSuspend = async (emp: Employee) => {
    if (!window.confirm(`Voulez-vous suspendre temporairement le contrat de ${emp.firstName} ${emp.lastName} ?`)) return;
    try {
      await dispatch(
        updateEmployee({
          id: emp.id,
          data: { status: 'SUSPENDED' }
        })
      ).unwrap();
      toast.success('Contrat suspendu avec succès. ⏸️');
      dispatch(setSelected(null)); // Refresh drawer
      dispatch(fetchEmployees({ page }));
    } catch (err: any) {
      toast.error(err || 'Erreur lors de la suspension');
    }
  };

  // Transition: Reactivate (SUSPENDED -> ACTIVE)
  const handleReactivate = async (emp: Employee) => {
    if (!window.confirm(`Voulez-vous réactiver le contrat de ${emp.firstName} ${emp.lastName} ?`)) return;
    try {
      await dispatch(
        updateEmployee({
          id: emp.id,
          data: { status: 'ACTIVE' }
        })
      ).unwrap();
      toast.success('Contrat réactivé avec succès ! ▶️');
      dispatch(setSelected(null)); // Refresh drawer
      dispatch(fetchEmployees({ page }));
    } catch (err: any) {
      toast.error(err || 'Erreur lors de la réactivation');
    }
  };

  // Transition: Archive (TERMINATED -> ARCHIVED)
  const handleArchive = async (emp: Employee) => {
    if (!window.confirm(`Voulez-vous archiver définitivement le dossier de ${emp.firstName} ${emp.lastName} ? Cette action est irréversible.`)) return;
    try {
      await dispatch(
        updateEmployee({
          id: emp.id,
          data: { status: 'ARCHIVED' }
        })
      ).unwrap();
      toast.success('Fiche archivée avec succès. 📁');
      dispatch(setSelected(null)); // Refresh drawer
      dispatch(fetchEmployees({ page }));
    } catch (err: any) {
      toast.error(err || 'Erreur lors de l\'archivage');
    }
  };

  // Hard Delete (Admin only)
  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer définitivement cet employé ?')) return;
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      toast.success('Employé supprimé avec succès.');
      dispatch(setSelected(null));
      dispatch(fetchEmployees({ page }));
    } catch (err: any) {
      toast.error(err || 'Erreur de suppression');
    }
  };

  // Helper styles for Badges
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'badge-amber';
      case 'ACTIVE': return 'badge-success';
      case 'SUSPENDED': return 'badge-warning';
      case 'TERMINATED': return 'badge-error';
      case 'ARCHIVED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-error';
      case 'HR': return 'badge-mauve';
      case 'MANAGER': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  // Generate Interactive Contract Timeline Milestones (Phase 3 Step 3)
  const getTimelineEvents = (emp: Employee) => {
    const events = [];

    // 1. Brouillon
    if (emp.createdAt) {
      events.push({
        title: 'Création de la fiche',
        description: 'Fiche collaborateur initialisée en statut DRAFT (Brouillon RH).',
        date: new Date(emp.createdAt).toLocaleDateString('fr-CA'),
        icon: <Clock size={12} />,
        color: '#f59e0b'
      });
    }

    // 2. Onboarding (Entrée en service)
    if (emp.status !== 'DRAFT') {
      events.push({
        title: 'Validation & Onboarding',
        description: 'Contrat validé et actif. Droits applicatifs ouverts.',
        date: new Date(emp.hireDate || emp.createdAt).toLocaleDateString('fr-CA'),
        icon: <UserCheck size={12} />,
        color: '#10b981'
      });
    }

    // 3. Pause (Suspension temporaire)
    if (emp.status === 'SUSPENDED') {
      events.push({
        title: 'Suspension de contrat',
        description: 'Contrat temporairement suspendu (Absence, congé sabbatique).',
        date: new Date().toLocaleDateString('fr-CA'),
        icon: <Pause size={12} />,
        color: '#f97316'
      });
    }

    // 4. Fin de contrat (Offboarding)
    if (emp.status === 'TERMINATED' || emp.status === 'ARCHIVED') {
      events.push({
        title: 'Rupture de contrat (Offboarding)',
        description: `Procédure de départ finalisée. Motif : ${emp.customAttributes?.offboardingReason || 'Départ standard/Autre'}`,
        date: new Date().toLocaleDateString('fr-CA'),
        icon: <UserX size={12} />,
        color: '#ef4444'
      });
    }

    // 5. Archivage (Soft delete)
    if (emp.status === 'ARCHIVED') {
      events.push({
        title: 'Archivage RGPD',
        description: 'Dossier archivé et sécurisé. Données masquées des listes actives.',
        date: new Date().toLocaleDateString('fr-CA'),
        icon: <Archive size={12} />,
        color: '#64748b'
      });
    }

    return events;
  };

  return (
    <div className="page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>👥 Employee Hub</h1>
          <p className="text-muted">Gerez le cycle de vie, les statuts contractuels, et la traçabilité des profils collaborateurs.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => setShowAddDrawer(true)}>
            <Plus size={18} />
            Créer un collaborateur
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4 mb-4">
        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Total Employés</span>
            <div style={{ color: 'var(--blue)' }}><Users size={24} /></div>
          </div>
          <h2>{total}</h2>
          <span className="text-xs text-muted">Profils enregistrés</span>
        </div>

        <div className="kpi-card text-success">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Effectifs Actifs</span>
            <div style={{ color: 'var(--green)' }}><UserCheck size={24} /></div>
          </div>
          <h2>{list.filter(e => e.status === 'ACTIVE').length}</h2>
          <span className="text-xs text-muted">Contrats actifs sur ce tenant</span>
        </div>

        <div className="kpi-card text-amber">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Fiches Brouillons</span>
            <div style={{ color: 'var(--yellow)' }}><Clock size={24} /></div>
          </div>
          <h2>{list.filter(e => e.status === 'DRAFT').length}</h2>
          <span className="text-xs text-muted">Profils en attente d'onboarding</span>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center">
            <span className="text-muted font-semibold">Dossiers Archivés</span>
            <div style={{ color: 'var(--mauve)' }}><Archive size={24} /></div>
          </div>
          <h2>{list.filter(e => e.status === 'ARCHIVED').length}</h2>
          <span className="text-xs text-muted">Anciens contrats sécurisés</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-muted" size={18} />
          <input
            type="text"
            className="input w-full"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Rechercher par nom, matricule ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 items-center">
          <SlidersHorizontal size={18} className="text-muted hidden md:inline" />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon (DRAFT)</option>
            <option value="ACTIVE">Actif (ACTIVE)</option>
            <option value="SUSPENDED">Suspendu (SUSPENDED)</option>
            <option value="TERMINATED">Terminé (TERMINATED)</option>
            <option value="ARCHIVED">Archivé (ARCHIVED)</option>
          </select>

          <select
            className="input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="HR">Ressources Humaines</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employé</option>
          </select>
        </div>
      </div>

      {/* Split screen layout for Progressive Disclosure (Rule 1) */}
      <div className="grid-2" style={{ gridTemplateColumns: selected ? '60% 40%' : '100%', gap: '1.5rem', transition: 'all 0.3s ease' }}>
        {/* Table list view */}
        <div className="card p-0 overflow-hidden">
          {/* Skeleton Loaders for Loading state (Rule 3) */}
          {isLoading ? (
            <div className="p-6 flex flex-col gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse py-2" style={{ borderBottom: '1px solid var(--surface0)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface0" style={{ borderRadius: '50%' }} />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 bg-surface0" style={{ width: '120px', borderRadius: '4px' }} />
                      <div className="h-3 bg-surface0" style={{ width: '180px', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div className="h-6 bg-surface0" style={{ width: '80px', borderRadius: '12px' }} />
                  <div className="h-4 bg-surface0" style={{ width: '60px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--overlay0)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <h4>Aucun collaborateur trouvé</h4>
              <p className="text-muted text-sm mt-1">Ajustez vos filtres ou créez une nouvelle fiche.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Matricule</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Actions Rapides</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => dispatch(setSelected(emp))}
                      style={{
                        cursor: 'pointer',
                        background: selected?.id === emp.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center font-bold text-sm bg-primary text-white"
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'var(--gradient-primary)'
                            }}
                          >
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-text">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-xs text-muted">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-muted block bg-surface0" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                          {emp.employeeNumber}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(emp.role)}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(emp.status)}`}>
                          ● {emp.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {emp.status === 'DRAFT' && (
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOnboard(emp.id)}
                              title="Valider et Onboarder"
                            >
                              <UserCheck size={12} />
                              Onboard
                            </button>
                          )}
                          {emp.status === 'ACTIVE' && (
                            <button
                              className="btn btn-warning btn-xs"
                              onClick={() => handleSuspend(emp)}
                              title="Suspendre contrat"
                            >
                              <Pause size={12} />
                            </button>
                          )}
                          {emp.status === 'SUSPENDED' && (
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleReactivate(emp)}
                              title="Réactiver contrat"
                            >
                              <Play size={12} />
                            </button>
                          )}
                          {(emp.status === 'ACTIVE' || emp.status === 'SUSPENDED') && (
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => {
                                setOffboardTarget(emp);
                                setShowOffboardModal(true);
                              }}
                              title="Offboarding"
                            >
                              <UserX size={12} />
                            </button>
                          )}
                          {emp.status === 'TERMINATED' && (
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleArchive(emp)}
                              title="Archiver le dossier"
                            >
                              <Archive size={12} />
                              Archiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center p-4" style={{ borderTop: '1px solid var(--surface0)' }}>
            <span className="text-xs text-muted">
              Page {currentPage} sur {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(prev => prev - 1)}
              >
                Précédent
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {/* 360° Profile Side Drawer (Rule 1: Progressive Disclosure) */}
        {selected && (
          <div className="card flex flex-col gap-6 animate-fade-in relative" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
            <button
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                zIndex: 10
              }}
              onClick={() => dispatch(setSelected(null))}
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mt-2">
              <div
                className="flex items-center justify-center font-bold text-xl bg-primary text-white"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)'
                }}
              >
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider block">Fiche Collaborateur</span>
                <h3 className="font-bold text-lg leading-tight">{selected.firstName} {selected.lastName}</h3>
                <span className="font-mono text-xs text-muted">{selected.employeeNumber}</span>
              </div>
            </div>

            {/* FSM Status Ribbon */}
            <div className={`p-3 rounded-lg flex items-center justify-between ${getStatusBadgeClass(selected.status)}`} style={{ opacity: 0.9 }}>
              <span className="text-xs font-semibold">Statut actuel : {selected.status}</span>
              <div className="flex gap-2">
                {selected.status === 'DRAFT' && (
                  <button className="btn btn-primary btn-xs bg-white text-primary font-bold" onClick={() => handleOnboard(selected.id)}>
                    Activer
                  </button>
                )}
                {selected.status === 'ACTIVE' && (
                  <button className="btn btn-danger btn-xs bg-white text-error font-bold" onClick={() => { setOffboardTarget(selected); setShowOffboardModal(true); }}>
                    Offboarder
                  </button>
                )}
              </div>
            </div>

            {/* Core Info Section */}
            <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} />
                Informations administratives
              </h4>
              <div className="grid-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Email</span>
                  <span className="font-medium flex items-center gap-2">
                    <Mail size={14} className="text-primary" />
                    {selected.email}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Téléphone</span>
                  <span className="font-medium flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    {selected.phoneNumber || 'Non renseigné'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-xs text-muted">Rôle système</span>
                  <span className="font-bold text-primary">{selected.role}</span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-xs text-muted">Date d'embauche</span>
                  <span className="font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {new Date(selected.hireDate).toLocaleDateString('fr-CA')}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={14} />
                Paramètres de Paie
              </h4>
              <div className="grid-2 text-sm bg-surface0 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Salaire annuel</span>
                  <span className="font-bold text-lg text-green">{selected.annualSalary?.toFixed(2) || '0.00'} $</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Taux horaire</span>
                  <span className="font-bold text-lg text-primary">{selected.hourlyRate?.toFixed(2) || '0.00'} $/h</span>
                </div>
              </div>
            </div>

            {/* Custom attributes display */}
            <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} />
                Attributs personnalisés (JSONB)
              </h4>
              {selected.customAttributes && Object.keys(selected.customAttributes).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected.customAttributes).map(([k, v]) => (
                    <span key={k} className="text-xs bg-surface0" style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--surface0)' }}>
                      <strong>{k} :</strong> {String(v)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted italic">Aucun attribut personnalisé défini.</span>
              )}
            </div>

            {/* Interactive Timeline of Events (Rule 1: progressive disclosure / 360 profile) */}
            <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} />
                Historique des Contrats (Timeline)
              </h4>
              <div className="flex flex-col gap-4 mt-2">
                {getTimelineEvents(selected).map((evt, idx) => (
                  <div key={idx} className="flex gap-3 items-start relative">
                    {/* Line separator between points */}
                    {idx < getTimelineEvents(selected).length - 1 && (
                      <div
                        className="absolute"
                        style={{
                          left: '12px',
                          top: '24px',
                          bottom: '-20px',
                          width: '2px',
                          backgroundColor: 'var(--surface0)',
                          zIndex: 0
                        }}
                      />
                    )}
                    
                    {/* Event Circle Indicator */}
                    <div
                      className="flex items-center justify-center text-white font-bold"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: evt.color || 'var(--primary)',
                        zIndex: 1,
                        flexShrink: 0
                      }}
                    >
                      {evt.icon}
                    </div>
                    
                    {/* Event Content */}
                    <div className="flex flex-col text-xs" style={{ zIndex: 1 }}>
                      <span className="font-bold text-text">{evt.title}</span>
                      <span className="text-muted mt-0.5">{evt.description}</span>
                      <span className="text-[10px] text-primary mt-1 font-semibold">{evt.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--surface0)', paddingTop: '1rem' }}>
              <h4 className="text-xs font-bold text-error uppercase tracking-wider">Zone de Danger</h4>
              <div className="flex gap-2">
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>
                  <Trash2 size={14} />
                  Supprimer la fiche
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER / SLIDE-PANEL : Créer un nouvel employé (Rule 2: Auto-save Drafts active) */}
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

            <h3 className="mb-2">👤 Créer un collaborateur</h3>
            <p className="text-xs text-muted mb-4">
              La fiche sera initialisée en tant que <strong>DRAFT</strong>.
            </p>

            <div className="bg-surface0 p-3 rounded-lg mb-4 flex items-center gap-2 text-xs text-amber">
              <Info size={16} />
              <span>Saisie auto-sauvegardée en brouillon local.</span>
            </div>

            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
              <div className="grid-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Prénom *</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: Jean"
                    value={newEmployee.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Nom de famille *</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: Tremblay"
                    value={newEmployee.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Email professionnel *</label>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="Ex: jean.tremblay@entreprise.com"
                  value={newEmployee.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Téléphone</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: +1-514-555-0100"
                    value={newEmployee.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Date d'embauche *</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={newEmployee.hireDate}
                    onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Salaire annuel ($)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newEmployee.annualSalary}
                    onChange={(e) => handleInputChange('annualSalary', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Taux horaire ($/h)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newEmployee.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Rôle Système</label>
                <select
                  className="input w-full"
                  value={newEmployee.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <option value="EMPLOYEE">Employé</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">Ressources Humaines</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              {/* Dynamic Metadata Attributes Inputs (JSONB column demonstration) */}
              <div style={{ borderTop: '1px dashed var(--surface0)', paddingTop: '1rem' }}>
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  Attributs Personnalisés (JSONB)
                </h4>
                <div className="grid-2 gap-3 mb-2">
                  <div>
                    <label className="text-xs text-muted block mb-1">Langues parlées</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Ex: Français, Anglais"
                      value={newEmployee.customAttributes.languages || ''}
                      onChange={(e) => handleCustomAttributeChange('languages', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Pointure Bottes Sécurité</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Ex: 10"
                      value={newEmployee.customAttributes.bootSize || ''}
                      onChange={(e) => handleCustomAttributeChange('bootSize', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button type="button" className="btn btn-secondary" onClick={clearCreationDraft}>
                  Réinitialiser
                </button>
                <div className="flex gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddDrawer(false)}>
                    Fermer
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} />
                    Créer en Brouillon
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : OFFBOARDING PROCESS */}
      {showOffboardModal && offboardTarget && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
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
              onClick={() => {
                setShowOffboardModal(false);
                setOffboardTarget(null);
              }}
            >
              <X size={20} />
            </button>

            <h3 className="mb-2">🚪 Procédure de départ (Offboarding)</h3>
            <p className="text-xs text-muted mb-4">
              L'employé <strong>{offboardTarget.firstName} {offboardTarget.lastName}</strong> passera en statut <strong>TERMINATED</strong>.
            </p>

            <form onSubmit={handleOffboardSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Date effective de rupture *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={offboardForm.terminationDate}
                  onChange={(e) => setOffboardForm(prev => ({ ...prev, terminationDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Motif de rupture du contrat *</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Ex: Fin de contrat saisonnier, Démission, etc."
                  value={offboardForm.reason}
                  onChange={(e) => setOffboardForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowOffboardModal(false);
                    setOffboardTarget(null);
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-danger">
                  <UserX size={16} />
                  Valider le départ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
