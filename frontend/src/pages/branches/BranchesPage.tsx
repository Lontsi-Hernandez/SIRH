import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { useNavigate } from 'react-router-dom';
import { fetchBranches, createBranch, updateBranch, deleteBranch, Branch } from '../../store/slices/branchSlice';
import { toast } from 'react-hot-toast';
import styles from '../departments/DepartmentsPage.module.css';

export default function BranchesPage() {
  const dispatch = useAppDispatch();
  const { list: branches, isLoading } = useAppSelector((state) => state.branches);
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  
  const [form, setForm] = useState({ name: '', code: '', address: '' });

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  const filtered = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.code?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: '', code: '', address: '' });
    setModalMode('create');
  };

  const openEdit = (b: Branch) => {
    setForm({ name: b.name, code: b.code || '', address: b.address || '' });
    setEditTarget(b);
    setModalMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (modalMode === 'create') {
        await dispatch(createBranch(form)).unwrap();
        toast.success('Succursale créée avec succès !');
      } else if (modalMode === 'edit' && editTarget) {
        await dispatch(updateBranch({ id: editTarget.id, data: form })).unwrap();
        toast.success('Succursale modifiée avec succès !');
      }
      setModalMode('none');
    } catch (err: any) {
      toast.error(err || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (b: Branch) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la succursale "${b.name}" ?`)) return;
    try {
      await dispatch(deleteBranch(b.id)).unwrap();
      toast.success('Succursale supprimée.');
    } catch (err: any) {
      toast.error(err || 'Erreur lors de la suppression.');
    }
  };

  const navigate = useNavigate();

  const handleBranchClick = (branchId: string) => {
    navigate('/departments', { state: { branchId } });
  };

  return (
    <div className="page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🏢 Succursales</h1>
          <p className={styles.subtitle}>{branches.length} succursale{branches.length !== 1 ? 's' : ''}</p>
        </div>
        {isSuperAdmin && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            ➕ Nouvelle succursale
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.searchBar} style={{ flex: 1 }}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher une succursale..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(b => (
            <div 
              key={b.id} 
              className={styles.card} 
              style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onClick={() => handleBranchClick(b.id)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{b.name}</h3>
                {b.code && <span className={styles.deptCode}>{b.code}</span>}
              </div>
              <div style={{ margin: '1rem 0', color: '#a6adc8', fontSize: '0.85rem' }}>
                📍 {b.address || 'Aucune adresse spécifiée'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#89b4fa', marginTop: '0.5rem' }}>
                👁️ Voir les départements
              </div>
              {isSuperAdmin && (
                <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.btnEdit} onClick={() => openEdit(b)}>✏️ Modifier</button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(b)}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {modalMode !== 'none' && (
        <div className={styles.modalOverlay} onClick={() => setModalMode('none')}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {modalMode === 'create' ? 'Nouvelle Succursale' : 'Modifier la succursale'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nom de la succursale *</label>
                <input required className={styles.input} type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Code (optionnel)</label>
                <input className={styles.input} type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Adresse (optionnelle)</label>
                <input className={styles.input} type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalMode('none')}>Annuler</button>
                <button type="submit" className={styles.btnPrimary}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
