import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState, AppDispatch } from '../../store';
import { useApp } from '../../context/AppContext';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentManager,
  addAssistantManager,
  removeAssistantManager,
  Department,
} from '../../store/slices/departmentSlice';
import { fetchEmployees, Employee } from '../../store/slices/employeeSlice';
import { fetchBranches } from '../../store/slices/branchSlice';
import styles from './DepartmentsPage.module.css';

type ModalMode = 'create' | 'edit' | null;
const EMPTY_FORM = { name: '', description: '', code: '', managerId: '', branchId: '' };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#a6e3a1',
  DRAFT: '#89b4fa',
  SUSPENDED: '#f9e2af',
  TERMINATED: '#f38ba8',
  ARCHIVED: '#6c7086',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  HR: 'Ressources Humaines',
  MANAGER: 'Gérant',
  EMPLOYEE: 'Employé',
};

export default function DepartmentsPage() {
  const { t } = useApp();
  const dispatch = useDispatch<AppDispatch>();
  const { list: departments, isLoading } = useSelector((s: RootState) => s.departments);
  const { list: employees } = useSelector((s: RootState) => s.employees);
  const { list: branches } = useSelector((s: RootState) => s.branches);
  const { user } = useSelector((s: RootState) => s.auth);

  // ── UI State ──
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const [selectedBranchId, setSelectedBranchId] = useState<string>(location.state?.branchId || '');
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null);
  const [assignModal, setAssignModal] = useState<Department | null>(null);
  const [assignManagerId, setAssignManagerId] = useState('');

  // Update selected branch if navigation state changes
  useEffect(() => {
    if (location.state?.branchId && location.state.branchId !== selectedBranchId) {
      setSelectedBranchId(location.state.branchId);
    }
  }, [location.state]);

  // ── Employee Panel State ──
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empSearch, setEmpSearch] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';

  // Le département dont l'utilisateur connecté est le gérant
  const myDept = useMemo(() =>
    isManager ? departments.find(d => d.managerId && employees.find(e => e.email === user?.email && e.id === d.managerId)) : null,
    [isManager, departments, employees, user]
  );

  // ── Assistant modal state ──
  const [assistantModal, setAssistantModal] = useState<Department | null>(null);
  const [assistantId, setAssistantId] = useState('');

  useEffect(() => {
    dispatch(fetchBranches());
    dispatch(fetchDepartments(selectedBranchId || undefined));
    dispatch(fetchEmployees({ limit: 1000, branchId: selectedBranchId || undefined }));
  }, [dispatch, selectedBranchId]);

  const managers = useMemo(
    () => employees.filter(e => ['ADMIN', 'HR', 'MANAGER'].includes(e.role)),
    [employees],
  );

  const filtered = useMemo(
    () => departments.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()),
    ),
    [departments, search],
  );

  const deptEmployees = useMemo(() => {
    if (!selectedDept) return [];
    
    // Filtrage
    const filtered = employees
      .filter(e => e.departmentId === selectedDept.id)
      .filter(e =>
        empSearch === '' ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.email.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.position?.title?.toLowerCase().includes(empSearch.toLowerCase()),
      );
      
    // Tri hiérarchique: Gérant > Assistant Gérant > Employé
    return filtered.sort((a, b) => {
      const isManagerA = a.id === selectedDept.managerId;
      const isManagerB = b.id === selectedDept.managerId;
      if (isManagerA && !isManagerB) return -1;
      if (!isManagerA && isManagerB) return 1;

      const isAssistantA = selectedDept.assistantManagerIds?.includes(a.id);
      const isAssistantB = selectedDept.assistantManagerIds?.includes(b.id);
      if (isAssistantA && !isAssistantB) return -1;
      if (!isAssistantA && isAssistantB) return 1;

      // Tri alphabétique par défaut
      return a.lastName.localeCompare(b.lastName);
    });
  }, [selectedDept, employees, empSearch]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setModalMode('create'); };
  const openEdit = (dept: Department) => {
    setForm({ name: dept.name, description: dept.description || '', code: dept.code || '', managerId: dept.managerId || '', branchId: dept.branchId || '' });
    setEditTarget(dept);
    setModalMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Le nom du département est obligatoire.'); return; }
    try {
      if (modalMode === 'create') {
        await dispatch(createDepartment({ name: form.name.trim(), description: form.description || undefined, code: form.code || undefined, managerId: form.managerId || undefined, branchId: form.branchId || undefined })).unwrap();
        toast.success(`✅ Département "${form.name}" créé avec succès !`);
      } else if (modalMode === 'edit' && editTarget) {
        await dispatch(updateDepartment({ id: editTarget.id, data: { name: form.name.trim(), description: form.description || undefined, code: form.code || undefined, managerId: form.managerId || undefined, branchId: form.branchId || undefined } })).unwrap();
        toast.success(`✅ Département "${form.name}" mis à jour !`);
        if (selectedDept?.id === editTarget.id) setSelectedDept(prev => prev ? { ...prev, ...form } : prev);
      }
      setModalMode(null);
    } catch (err: any) { toast.error(err || 'Une erreur est survenue.'); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await dispatch(deleteDepartment(confirmDelete.id)).unwrap();
      toast.success(`🗑️ Département "${confirmDelete.name}" supprimé.`);
      if (selectedDept?.id === confirmDelete.id) setSelectedDept(null);
      setConfirmDelete(null);
    } catch (err: any) { toast.error(err || 'Erreur lors de la suppression.'); }
  };

  const handleAssignManager = async () => {
    if (!assignModal) return;
    try {
      const result = await dispatch(assignDepartmentManager({ deptId: assignModal.id, managerId: assignManagerId })).unwrap();
      toast.success('👤 Gérant assigné avec succès !');
      if (selectedDept?.id === assignModal.id) setSelectedDept(result);
      setAssignModal(null); setAssignManagerId('');
    } catch (err: any) { toast.error(err || 'Erreur lors de l\'assignation.'); }
  };

  const getManagerName = (dept: Department) => {
    if (dept.manager) return `${dept.manager.firstName} ${dept.manager.lastName}`;
    const emp = employees.find(e => e.id === dept.managerId);
    return emp ? `${emp.firstName} ${emp.lastName}` : '—';
  };

  const getEmpCountForDept = (deptId: string) => employees.filter(e => e.departmentId === deptId).length;

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  const getStatusBg = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'rgba(166,227,161,0.12)',
      DRAFT: 'rgba(137,180,250,0.12)',
      SUSPENDED: 'rgba(249,226,175,0.12)',
      TERMINATED: 'rgba(243,139,168,0.12)',
      ARCHIVED: 'rgba(108,112,134,0.12)',
    };
    return map[status] || 'rgba(108,112,134,0.12)';
  };

  const panelOpen = !!selectedDept;

  return (
    <div className={`${styles.page} ${panelOpen ? styles.withPanel : ''}`}>

      {/* ══════════ LEFT / MAIN COLUMN ══════════ */}
      <div className={styles.mainCol}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🏢 Départements & Équipes</h1>
            <p className={styles.subtitle}>
              {departments.length} département{departments.length !== 1 ? 's' : ''} · {employees.length} employés au total
            </p>
          </div>
          {isSuperAdmin && (
            <button className={styles.btnPrimary} onClick={openCreate}>
              ➕ Nouveau département
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
          <div className={styles.searchBar} style={{ flex: 1 }}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher un département..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
          </div>

          {isAdminOrHR && branches.length > 0 && (
            <div className={styles.searchBar} style={{ width: '250px' }}>
              <span className={styles.searchIcon}>🏢</span>
              <select 
                className={styles.searchInput} 
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                style={{ padding: 0 }}
              >
                <option value="">Toutes les succursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className={styles.kpiRow}>
          {[
            { label: 'Départements', value: departments.length, icon: '🏢', color: '#89b4fa' },
            { label: 'Avec Gérant', value: departments.filter(d => d.managerId).length, icon: '👤', color: '#a6e3a1' },
            { label: 'Sans Gérant', value: departments.filter(d => !d.managerId).length, icon: '⚠️', color: '#f9e2af' },
            { label: 'Total Employés', value: employees.length, icon: '👥', color: '#cba6f7' },
          ].map(kpi => (
            <div key={kpi.label} className={styles.kpiCard}>
              <span className={styles.kpiIcon}>{kpi.icon}</span>
              <div>
                <div className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value}</div>
                <div className={styles.kpiLabel}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Department grid */}
        {isLoading ? (
          <div className={styles.loading}>⏳ Chargement des départements...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏢</div>
            <p>{search ? 'Aucun département trouvé.' : 'Aucun département créé pour le moment.'}</p>
            {isSuperAdmin && !search && (
              <button className={styles.btnPrimary} onClick={openCreate}>Créer le premier département</button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
          {filtered
            // Les managers ne voient que leur propre département
            .filter(dept => isAdminOrHR || !isManager || dept.id === myDept?.id)
            .map(dept => {
              const empCount = getEmpCountForDept(dept.id);
              const hasManager = !!dept.managerId;
              const isActive = selectedDept?.id === dept.id;
              const assistants = (dept.assistantManagerIds ?? []).map(aid => employees.find(e => e.id === aid)).filter(Boolean) as typeof employees;
              const canManageAssistants = isAdminOrHR || (isManager && dept.id === myDept?.id);
              const assistantSlotsFull = assistants.length >= 2;
              return (
                <div
                  key={dept.id}
                  className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                  onClick={() => {
                    setSelectedDept(isActive ? null : dept);
                    setSelectedEmployee(null);
                    setEmpSearch('');
                  }}
                >
                  <div className={styles.cardStripe} style={{
                    background: hasManager
                      ? 'linear-gradient(90deg, #a6e3a1, #89b4fa)'
                      : 'linear-gradient(90deg, #f9e2af, #f38ba8)',
                  }} />

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.deptName}>{dept.name}</h3>
                        {dept.code && <span className={styles.deptCode}>{dept.code}</span>}
                      </div>
                      <div className={styles.cardBadge} style={{
                        background: hasManager ? 'rgba(166,227,161,0.15)' : 'rgba(249,226,175,0.15)',
                        color: hasManager ? '#a6e3a1' : '#f9e2af',
                        border: `1px solid ${hasManager ? 'rgba(166,227,161,0.3)' : 'rgba(249,226,175,0.3)'}`,
                      }}>
                        {hasManager ? '✅ Géré' : '⚠️ Sans Gérant'}
                      </div>
                    </div>

                    {dept.description && <p className={styles.deptDesc}>{dept.description}</p>}

                    <div className={styles.cardStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>👥 Effectif</span>
                        <strong className={styles.statValue}>{empCount} employé{empCount !== 1 ? 's' : ''}</strong>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>👤 Gérant</span>
                        <strong className={styles.statValue} style={{ color: hasManager ? '#a6e3a1' : '#6c7086' }}>
                          {getManagerName(dept)}
                        </strong>
                      </div>
                    </div>

                    {/* ── Assistants-gérants ── */}
                    {(canManageAssistants || assistants.length > 0) && (
                      <div style={{ marginBottom: '0.6rem', background: '#11111b', borderRadius: '7px', padding: '0.6rem 0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6c7086', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.06em' }}>
                          🤝 Assistants-gérants ({assistants.length}/2)
                        </div>
                        {assistants.map(a => (
                          <div key={a!.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#cdd6f4' }}>• {a!.firstName} {a!.lastName}</span>
                            {canManageAssistants && (
                              <button
                                style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                                onClick={async (e) => { e.stopPropagation(); if (!window.confirm(`Retirer ${a!.firstName} ${a!.lastName} comme assistant ?`)) return; await dispatch(removeAssistantManager({ deptId: dept.id, assistantId: a!.id })); toast.success('Assistant retiré.'); }}
                              >✕</button>
                            )}
                          </div>
                        ))}
                        {canManageAssistants && !assistantSlotsFull && (
                          <button
                            className={styles.btnEdit}
                            style={{ marginTop: '0.35rem', fontSize: '0.72rem', width: '100%' }}
                            onClick={(e) => { e.stopPropagation(); setAssistantModal(dept); setAssistantId(''); }}
                          >
                            ➕ Ajouter un assistant
                          </button>
                        )}
                        {canManageAssistants && assistantSlotsFull && (
                          <p style={{ fontSize: '0.68rem', color: '#f9e2af', marginTop: '0.35rem', textAlign: 'center' }}>⚠️ Maximum 2 assistants atteint</p>
                        )}
                      </div>
                    )}

                    {/* Click hint */}
                    <div className={styles.viewHint}>
                      {isActive ? '▼ Fermer le panneau' : `👁️ Voir les ${empCount} employé${empCount !== 1 ? 's' : ''}`}
                    </div>

                    {isSuperAdmin && (
                      <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                        <button className={styles.btnAssign} onClick={() => { setAssignModal(dept); setAssignManagerId(dept.managerId || ''); }}>
                          👤 Gérant
                        </button>
                        <button className={styles.btnEdit} onClick={() => openEdit(dept)}>✏️ Modifier</button>
                        <button className={styles.btnDelete} onClick={() => setConfirmDelete(dept)}>🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ RIGHT PANEL — EMPLOYEES ══════════ */}
      {panelOpen && (
        <div className={styles.panel}>
          {/* Panel Header */}
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {selectedDept!.name}
                {selectedDept!.code && <span className={styles.deptCode} style={{ marginLeft: '0.5rem' }}>{selectedDept!.code}</span>}
              </h2>
              <p className={styles.panelSubtitle}>
                {deptEmployees.length} employé{deptEmployees.length !== 1 ? 's' : ''}
                {selectedDept!.managerId && ` · Gérant : ${getManagerName(selectedDept!)}`}
              </p>
            </div>
            <button className={styles.closePanel} onClick={() => { setSelectedDept(null); setSelectedEmployee(null); }}>✕</button>
          </div>

          {/* Employee search */}
          <div className={styles.panelSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher un employé..."
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
            />
            {empSearch && <button className={styles.clearSearch} onClick={() => setEmpSearch('')}>✕</button>}
          </div>

          {/* Split: list + detail */}
          <div className={styles.panelBody}>
            {/* Employee list */}
            <div className={styles.empList}>
              {deptEmployees.length === 0 ? (
                <div className={styles.empEmpty}>
                  <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>👥</span>
                  <p style={{ color: '#6c7086', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>
                    {empSearch ? 'Aucun résultat.' : 'Aucun employé dans ce département.'}
                  </p>
                </div>
              ) : deptEmployees.map(emp => {
                const isSelected = selectedEmployee?.id === emp.id;
                const isManager = selectedDept?.managerId === emp.id;
                const isAssistant = selectedDept?.assistantManagerIds?.includes(emp.id);

                return (
                  <div
                    key={emp.id}
                    className={`${styles.empRow} ${isSelected ? styles.empRowActive : ''}`}
                    onClick={() => setSelectedEmployee(isSelected ? null : emp)}
                  >
                    <div className={styles.empAvatar} style={{
                      background: `linear-gradient(135deg, ${STATUS_COLORS[emp.status] ?? '#89b4fa'}, #b4befe)`,
                    }}>
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className={styles.empRowInfo}>
                      <span className={styles.empRowName}>
                        {emp.firstName} {emp.lastName}
                        {isManager && <span style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', backgroundColor: '#a6e3a1', color: '#11111b', fontWeight: 'bold' }}>Gérant</span>}
                        {isAssistant && <span style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', backgroundColor: '#f9e2af', color: '#11111b', fontWeight: 'bold' }}>Assistant</span>}
                      </span>
                      <span className={styles.empRowRole}>{emp.position?.title || ROLE_LABELS[emp.role] || emp.role}</span>
                    </div>
                    <span
                      className={styles.empStatus}
                      style={{
                        color: STATUS_COLORS[emp.status] ?? '#6c7086',
                        background: getStatusBg(emp.status),
                      }}
                    >
                      {emp.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Employee detail panel */}
            {selectedEmployee && (
              <div className={styles.empDetail}>
                {/* Avatar + name */}
                <div className={styles.empDetailHeader}>
                  <div className={styles.empDetailAvatar} style={{
                    background: `linear-gradient(135deg, ${STATUS_COLORS[selectedEmployee.status] ?? '#89b4fa'} 0%, #b4befe 100%)`,
                  }}>
                    {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                  </div>
                  <div>
                    <h3 className={styles.empDetailName}>{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                    <span className={styles.empDetailRole}>{ROLE_LABELS[selectedEmployee.role] ?? selectedEmployee.role}</span>
                  </div>
                  <button className={styles.closePanel} style={{ marginLeft: 'auto' }} onClick={() => setSelectedEmployee(null)}>✕</button>
                </div>

                {/* Status badge */}
                <div className={styles.empDetailStatus} style={{
                  background: getStatusBg(selectedEmployee.status),
                  borderColor: STATUS_COLORS[selectedEmployee.status] ?? '#6c7086',
                  color: STATUS_COLORS[selectedEmployee.status] ?? '#6c7086',
                }}>
                  ● {selectedEmployee.status}
                </div>

                {/* Info grid */}
                <div className={styles.empDetailGrid}>
                  {[
                    { label: '📧 Email', value: selectedEmployee.email },
                    { label: '📱 Téléphone', value: selectedEmployee.phoneNumber || '—' },
                    { label: '🏷️ Numéro', value: selectedEmployee.employeeNumber },
                    { label: '💼 Poste', value: selectedEmployee.position?.title || '—' },
                    { label: '📅 Embauché le', value: selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('fr-CA') : '—' },
                    { label: '💰 Taux horaire', value: selectedEmployee.hourlyRate ? `${Number(selectedEmployee.hourlyRate).toFixed(2)} $/h` : '—' },
                    { label: '💵 Salaire annuel', value: selectedEmployee.annualSalary ? `${Number(selectedEmployee.annualSalary).toLocaleString('fr-CA')} $` : '—' },
                    { label: '🔑 Rôle système', value: ROLE_LABELS[selectedEmployee.role] ?? selectedEmployee.role },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.empDetailItem}>
                      <span className={styles.empDetailLabel}>{label}</span>
                      <span className={styles.empDetailValue}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Manager info */}
                {selectedEmployee.manager && (
                  <div className={styles.empDetailManager}>
                    <span style={{ color: '#6c7086', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      👤 Supérieur direct
                    </span>
                    <div className={styles.empManagerInfo}>
                      <div className={styles.empMgrAvatar}>
                        {getInitials(selectedEmployee.manager.firstName, selectedEmployee.manager.lastName)}
                      </div>
                      <span>{selectedEmployee.manager.firstName} {selectedEmployee.manager.lastName}</span>
                    </div>
                  </div>
                )}

                {/* Custom attributes */}
                {selectedEmployee.customAttributes && Object.keys(selectedEmployee.customAttributes).length > 0 && (
                  <div className={styles.empDetailCustom}>
                    <span style={{ color: '#6c7086', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ✨ Attributs personnalisés
                    </span>
                    <div className={styles.customTags}>
                      {Object.entries(selectedEmployee.customAttributes).map(([k, v]) => (
                        <span key={k} className={styles.customTag}><strong>{k}</strong> : {String(v)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL ASSISTANT-GÉRANT ── */}
      {assistantModal && (
        <div className={styles.overlay} onClick={() => setAssistantModal(null)}>
          <div className={styles.modal} style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🤝 Ajouter un Assistant-Gérant</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setAssistantModal(null)}>✕</button>
            </div>
            <p style={{ color: '#a6adc8', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Département : <strong style={{ color: '#89b4fa' }}>{assistantModal.name}</strong><br />
              <span style={{ color: '#f9e2af', fontSize: '0.78rem' }}>⚠️ Maximum 2 assistants-gérants autorisés.</span>
            </p>
            <div className={styles.formGroup}>
              <label>Choisir un employé du département</label>
              <select className={styles.input} value={assistantId} onChange={e => setAssistantId(e.target.value)}>
                <option value="">— Sélectionner —</option>
                {employees
                  .filter(e => e.departmentId === assistantModal.id && e.id !== assistantModal.managerId && !(assistantModal.assistantManagerIds ?? []).includes(e.id))
                  .map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.position?.title || e.role}</option>)
                }
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setAssistantModal(null)}>Annuler</button>
              <button
                className={styles.btnPrimary}
                disabled={!assistantId}
                onClick={async () => {
                  if (!assistantId) return;
                  try {
                    await dispatch(addAssistantManager({ deptId: assistantModal.id, assistantId })).unwrap();
                    toast.success('🤝 Assistant-gérant ajouté !');
                    setAssistantModal(null);
                  } catch (err: any) { toast.error(err || 'Erreur.'); }
                }}
              >✅ Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}
      {modalMode && (
        <div className={styles.overlay} onClick={() => setModalMode(null)}>
          <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'create' ? '🏢 Nouveau Département' : '✏️ Modifier le Département'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setModalMode(null)}>✕</button>
            </div>
            <div className={styles.formGroup}>
              <label>Nom du département <span style={{ color: '#f38ba8' }}>*</span></label>
              <input className={styles.input} type="text" placeholder="ex: Ressources Humaines, Cuisine, Service..." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Code (optionnel)</label>
                <input className={styles.input} type="text" placeholder="ex: RH, CUI, SRV" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} maxLength={10} />
              </div>
              {branches.length > 0 && (
                <div className={styles.formGroup}>
                  <label>Succursale</label>
                  <select className={styles.input} value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                    <option value="">— Non défini —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Gérant responsable</label>
              <select className={styles.input} value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}>
                <option value="">— Aucun gérant —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Description (optionnel)</label>
              <textarea className={styles.input} placeholder="Décrivez les responsabilités de ce département..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setModalMode(null)}>Annuler</button>
              <button type="submit" className={styles.btnPrimary}>{modalMode === 'create' ? '✅ Créer' : '💾 Sauvegarder'}</button>
            </div>
          </form>
        </div>
      )}

      {assignModal && (
        <div className={styles.overlay} onClick={() => setAssignModal(null)}>
          <div className={styles.modal} style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>👤 Assigner un Gérant</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <p style={{ color: '#a6adc8', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Département : <strong style={{ color: '#89b4fa' }}>{assignModal.name}</strong>
            </p>
            <div className={styles.formGroup}>
              <label>Sélectionner le Gérant</label>
              <select className={styles.input} value={assignManagerId} onChange={e => setAssignManagerId(e.target.value)}>
                <option value="">— Retirer le gérant —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.role} ({m.email})</option>)}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setAssignModal(null)}>Annuler</button>
              <button className={styles.btnPrimary} onClick={handleAssignManager}>✅ Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '0.75rem' }}>Supprimer le département ?</h2>
            <p style={{ color: '#a6adc8', marginBottom: '1.5rem' }}>
              Le département <strong style={{ color: '#f38ba8' }}>"{confirmDelete.name}"</strong> sera supprimé définitivement.
              Les employés ne seront <strong>pas supprimés</strong>, mais leur département sera retiré.
            </p>
            <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
              <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className={styles.btnDanger} onClick={handleDelete}>🗑️ Supprimer définitivement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
