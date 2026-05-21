import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { useApp } from '../../context/AppContext';
import {
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  Shift,
} from '../../store/slices/shiftSlice';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { shiftApi } from '../../services/api.service';
import styles from './ShiftsPage.module.css';

// Formater les dates pour l'affichage local français
const formatTime = (isoString: string | undefined | null) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateLong = (date: Date) => {
  return date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function ShiftsPage() {
  const dispatch = useAppDispatch();
  const { t } = useApp();
  const { user } = useAppSelector((state) => state.auth);
  const { list: shifts, isLoading, error } = useAppSelector((state) => state.shifts);
  const { list: employees } = useAppSelector((state) => state.employees);

  // Rôle de l'utilisateur
  const isManager = useMemo(() => {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';
  }, [user]);

  // État de l'onglet actif (pour les managers ayant accès aux deux vues)
  const [activeTab, setActiveTab] = useState<'planning' | 'clocking'>(isManager ? 'planning' : 'clocking');

  // Gestion de la semaine active
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentWeekStart]);

  // ── Filtre de Département ──────────────────────────────────────────────────
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const departments = useMemo(() => {
    const depsMap = new Map<string, { id: string, name: string }>();
    employees.forEach(e => {
      if (e.department) depsMap.set(e.department.id, e.department);
    });
    return Array.from(depsMap.values());
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!selectedDepartment) return employees;
    return employees.filter(e => e.department?.id === selectedDepartment);
  }, [employees, selectedDepartment]);

  // Charger les données à l'initialisation et au changement de semaine
  useEffect(() => {
    const startDate = weekDates[0].toISOString();
    const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
    dispatch(fetchShifts({ startDate, endDate: new Date(endDate).toISOString() }));
    
    if (isManager) {
      dispatch(fetchEmployees({ limit: 1000 })); // On charge tous les employés pour le filtre
    }
  }, [dispatch, weekDates, isManager]);

  // Navigation des semaines
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // ── Modal de Planification ─────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  // Champs formulaire
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartHour, setFormStartHour] = useState('08:00');
  const [formEndHour, setFormEndHour] = useState('16:00');
  const [formLocation, setFormLocation] = useState('Bureau Principal (Montréal)');
  const [formLat, setFormLat] = useState(45.5017);
  const [formLng, setFormLng] = useState(-73.5673);
  const [formNotes, setFormNotes] = useState('');
  const [formBreak, setFormBreak] = useState(30);

  const handleOpenCreateModal = () => {
    setSelectedShift(null);
    setFormEmployeeId(filteredEmployees[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartHour('08:00');
    setFormEndHour('16:00');
    setFormLocation('Bureau Principal (Montréal)');
    setFormLat(45.5017);
    setFormLng(-73.5673);
    setFormNotes('');
    setFormBreak(30);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setSelectedShift(shift);
    setFormEmployeeId(shift.employeeId);
    setFormDate(new Date(shift.startTime).toISOString().split('T')[0]);
    setFormStartHour(new Date(shift.startTime).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setFormEndHour(new Date(shift.endTime).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setFormLocation(shift.location || '');
    setFormLat(shift.locationLat || 45.5017);
    setFormLng(shift.locationLng || -73.5673);
    setFormNotes(shift.notes || '');
    setFormBreak(shift.breakDurationMinutes || 0);
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construire les dates en heure locale pour éviter le décalage UTC d'un jour
    const [yyyy, mm, dd] = formDate.split('-').map(Number);
    const [sh, sm] = formStartHour.split(':').map(Number);
    const [eh, em] = formEndHour.split(':').map(Number);
    const startLocal = new Date(yyyy, mm - 1, dd, sh, sm, 0);
    const endLocal   = new Date(yyyy, mm - 1, dd, eh, em, 0);
    const startTime  = startLocal.toISOString();
    const endTime    = endLocal.toISOString();

    const payload = {
      employeeId: formEmployeeId,
      startTime,
      endTime,
      location: formLocation,
      locationLat: Number(formLat),
      locationLng: Number(formLng),
      notes: formNotes,
      breakDurationMinutes: Number(formBreak),
    };

    if (selectedShift) {
      await dispatch(updateShift({ id: selectedShift.id, data: payload }));
    } else {
      await dispatch(createShift(payload));
    }

    setIsModalOpen(false);

    // Recharger la semaine qui contient le quart sauvegardé (peut être différente de la semaine affichée)
    const shiftWeekStart = new Date(startLocal);
    const dayOfWeek = shiftWeekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    shiftWeekStart.setDate(shiftWeekStart.getDate() + diff);
    shiftWeekStart.setHours(0, 0, 0, 0);
    const shiftWeekEnd = new Date(shiftWeekStart);
    shiftWeekEnd.setDate(shiftWeekStart.getDate() + 6);
    shiftWeekEnd.setHours(23, 59, 59, 999);
    dispatch(fetchShifts({ startDate: shiftWeekStart.toISOString(), endDate: shiftWeekEnd.toISOString() }));

    // Si la semaine du shift est différente de la semaine affichée, naviguer vers elle
    const currentStart = weekDates[0].getTime();
    if (shiftWeekStart.getTime() !== currentStart) {
      setCurrentWeekStart(new Date(shiftWeekStart));
    }
  };

  const handleDeleteShift = async () => {
    if (selectedShift && window.confirm(t('common.confirmDelete') || 'Êtes-vous sûr de vouloir supprimer ce quart de travail ?')) {
      await dispatch(deleteShift(selectedShift.id));
      setIsModalOpen(false);
    }
  };

  // ── Mode Pointage & Sécurité QR Code (Employee & Manager Views) ──────────────
  const [gpsSimulated, setGpsSimulated] = useState(true);
  const [simLat, setSimLat] = useState(45.5017); // Par défaut Montréal bureau principal
  const [simLng, setSimLng] = useState(-73.5673);
  const [pointageSuccessMessage, setPointageSuccessMessage] = useState('');

  // Borne QR Code (Manager Station)
  const [showQrStation, setShowQrStation] = useState(false);
  const [stationToken, setStationToken] = useState('');
  const [stationExpiresAt, setStationExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(15);

  // Scanner Modal (Employee Side)
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false);
  const [scanType, setScanType] = useState<'in' | 'out'>('in');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Charger et rafraîchir le QR Code de la Borne toutes les 15 secondes
  useEffect(() => {
    let interval: any;
    if (showQrStation) {
      const fetchToken = async () => {
        try {
          const res = await shiftApi.getQrCode();
          setStationToken(res.data.qrCodeToken);
          setStationExpiresAt(new Date(res.data.expiresAt));
          setSecondsLeft(15);
        } catch (e) {
          console.error("Erreur lors de la génération du code QR", e);
        }
      };

      fetchToken();
      interval = setInterval(fetchToken, 15000);
    }
    return () => clearInterval(interval);
  }, [showQrStation]);

  // Décompte de la barre de progression
  useEffect(() => {
    let timer: any;
    if (showQrStation && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQrStation, secondsLeft]);

  // Quart de travail en cours pour aujourd'hui
  const activeShiftForToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedInEmployee = employees.find(e => e.email === user?.email);
    const targetId = loggedInEmployee?.id || user?.id;

    return shifts.find((s) => {
      const shiftDay = new Date(s.startTime).toISOString().split('T')[0];
      return s.employeeId === targetId && shiftDay === todayStr && s.status !== 'COMPLETED';
    });
  }, [shifts, user, employees]);

  const handleOpenScanner = (type: 'in' | 'out') => {
    setScanType(type);
    setIsScanningModalOpen(true);
  };

  const handleClockIn = async (token: string) => {
    if (!activeShiftForToday) return;
    
    const lat = gpsSimulated ? simLat : undefined;
    const lng = gpsSimulated ? simLng : undefined;

    const resultAction = await dispatch(clockIn({
      shiftId: activeShiftForToday.id,
      latitude: lat,
      longitude: lng,
      qrCodeToken: token,
    }));

    if (clockIn.fulfilled.match(resultAction)) {
      setPointageSuccessMessage('✅ Pointage d\'Arrivée réussi avec succès via QR Code !');
      setIsScanningModalOpen(false);
      setTimeout(() => setPointageSuccessMessage(''), 5000);
      
      // Rafraîchir les horaires
      const startDate = weekDates[0].toISOString();
      const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
      dispatch(fetchShifts({ startDate, endDate: new Date(endDate).toISOString() }));
    } else {
      alert(resultAction.payload || 'Erreur lors du pointage d\'arrivée.');
    }
  };

  const handleClockOut = async (token: string) => {
    if (!activeShiftForToday) return;

    const lat = gpsSimulated ? simLat : undefined;
    const lng = gpsSimulated ? simLng : undefined;

    const resultAction = await dispatch(clockOut({
      shiftId: activeShiftForToday.id,
      latitude: lat,
      longitude: lng,
      qrCodeToken: token,
    }));

    if (clockOut.fulfilled.match(resultAction)) {
      setPointageSuccessMessage('✅ Pointage de Départ réussi avec succès via QR Code ! Bon repos !');
      setIsScanningModalOpen(false);
      setTimeout(() => setPointageSuccessMessage(''), 5000);

      // Rafraîchir les horaires
      const startDate = weekDates[0].toISOString();
      const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
      dispatch(fetchShifts({ startDate, endDate: new Date(endDate).toISOString() }));
    } else {
      alert(resultAction.payload || 'Erreur lors du pointage de départ.');
    }
  };

  // Simuler le scan du QR Code actif en interrogeant l'API
  const handleSimulateScan = async () => {
    setIsSimulatingScan(true);
    try {
      // 1. Récupérer le jeton actif généré par le serveur
      const res = await shiftApi.getQrCode();
      const activeToken = res.data.qrCodeToken;
      
      // 2. Lancer la validation selon le type
      if (scanType === 'in') {
        await handleClockIn(activeToken);
      } else {
        await handleClockOut(activeToken);
      }
    } catch (e: any) {
      alert("Échec de la simulation de scan : " + (e.response?.data?.message || e.message));
    } finally {
      setIsSimulatingScan(false);
    }
  };

  const handleStartBreak = async () => {
    if (!activeShiftForToday) return;
    try {
      await dispatch(startBreak(activeShiftForToday.id)).unwrap();
      setPointageSuccessMessage('☕ Pause débutée avec succès ! Profitez de votre pause.');
      setTimeout(() => setPointageSuccessMessage(''), 6000);
      
      // Rafraîchir les horaires
      const startDate = weekDates[0].toISOString();
      const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
      dispatch(fetchShifts({ startDate, endDate: new Date(endDate).toISOString() }));
    } catch (err: any) {
      alert(err || 'Erreur lors du début de la pause.');
    }
  };

  const handleEndBreak = async () => {
    if (!activeShiftForToday) return;
    try {
      await dispatch(endBreak(activeShiftForToday.id)).unwrap();
      setPointageSuccessMessage('💪 Pause terminée ! Bon retour au travail.');
      setTimeout(() => setPointageSuccessMessage(''), 6000);
      
      // Rafraîchir les horaires
      const startDate = weekDates[0].toISOString();
      const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
      dispatch(fetchShifts({ startDate, endDate: new Date(endDate).toISOString() }));
    } catch (err: any) {
      alert(err || 'Erreur lors de la fin de la pause.');
    }
  };

  const handlePublishShifts = async () => {
    const startDate = weekDates[0].toISOString();
    const endDate = new Date(weekDates[6]).setHours(23, 59, 59, 999);
    const endDateStr = new Date(endDate).toISOString();

    const confirmMsg = `Voulez-vous publier tous les quarts de travail en brouillon pour la semaine du ${weekDates[0].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} au ${weekDates[6].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })} ? Les employés recevront leurs notifications.`;

    if (window.confirm(confirmMsg)) {
      try {
        const res = await shiftApi.publish(startDate, endDateStr);
        alert(`🎉 ${res.data.publishedCount} quart(s) de travail publié(s) avec succès !`);
        
        // Rafraîchir les shifts
        dispatch(fetchShifts({ startDate, endDate: endDateStr }));
      } catch (err: any) {
        alert("Erreur lors de la publication : " + (err.response?.data?.message || err.message));
      }
    }
  };

  const breakStartStr = activeShiftForToday?.breakStartTime
    ? new Date(activeShiftForToday.breakStartTime).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    : '';

  const returnTimeStr = activeShiftForToday?.breakStartTime
    ? new Date(new Date(activeShiftForToday.breakStartTime).getTime() + activeShiftForToday.breakDurationMinutes * 60 * 1000)
        .toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <h1>{t('shifts.title')}</h1>
          <p>{t('shifts.subtitle')}</p>
        </div>

        <div className={styles.controls}>
          {isManager && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className={styles.formControl}
                style={{ minWidth: '180px', padding: '0.4rem', borderRadius: '6px', backgroundColor: '#181825', color: '#cdd6f4', border: '1px solid #313244' }}
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">🏢 {t('shifts.allDepartments')}</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>

              <div className={styles.weekNavigation}>
                <button className={styles.navBtn} onClick={handlePrevWeek} title={t('shifts.advancePlanning')}>◀</button>
                <button className={styles.btnSecondary} onClick={handleCurrentWeek}>{t('shifts.today')}</button>
                <span className={styles.weekRange}>
                  {t('shifts.weekOf', { start: weekDates[0].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), end: weekDates[6].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) })}
                </span>
                <button className={styles.navBtn} onClick={handleNextWeek} title={t('shifts.advancePlanning')}>▶</button>
              </div>
            </div>
          )}

          {isManager && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className={styles.btnSecondary}
                style={{ borderColor: '#f9e2af', color: '#f9e2af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handlePublishShifts}
              >
                📢 Publier le planning
              </button>
              <button
                className={styles.btnSecondary}
                style={{ borderColor: '#a6e3a1', color: '#a6e3a1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => setShowQrStation(true)}
              >
                📺 {t('shifts.btnQrStation')}
              </button>
              <button className={styles.btnPrimary} onClick={handleOpenCreateModal}>
                ➕ {t('shifts.btnSchedule')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ERROR / LOADING */}
      {error && <div className={styles.errorBanner}>{t('common.error')}: {error}</div>}
      {isLoading && <div className={styles.loadingBanner}>{t('common.loading')}</div>}

      {/* ── VUE 1 : GRILLE HEBDOMADAIRE EMPLOYÉS / SHIFTS (MANAGERS SEULEMENT) ── */}
      {isManager && (() => {
        const todayStr = new Date().toISOString().split('T')[0];

        // Heures planifiées d'un quart
        const shiftPlannedH = (s: Shift) => (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;

        // Heures réelles (avec soustraction des dépassements de pause)
        const shiftRealH = (s: Shift): number | null => {
          if (!s.actualStartTime || !s.actualEndTime) return null;
          let h = (new Date(s.actualEndTime).getTime() - new Date(s.actualStartTime).getTime()) / 3600000;
          if (s.breakStartTime && s.breakEndTime) {
            const bMs = new Date(s.breakEndTime).getTime() - new Date(s.breakStartTime).getTime();
            const allowed = s.breakDurationMinutes * 60000;
            if (bMs > allowed) h = Math.max(0, h - (bMs - allowed) / 3600000);
          }
          return h;
        };

        // Stats par employé pour la semaine affichée
        const empStats = (empId: string) => {
          const empShifts = shifts.filter(s => s.employeeId === empId);
          const planned = empShifts.reduce((a, s) => a + shiftPlannedH(s), 0);
          const real = empShifts.reduce((a, s) => a + (shiftRealH(s) ?? 0), 0);
          const completed = empShifts.filter(s => s.status === 'COMPLETED').length;
          const total = empShifts.length;
          return { planned, real, completed, total };
        };

        // Totaux planifiés par jour
        const dayTotals = weekDates.map(day => {
          const dStr = day.toISOString().split('T')[0];
          return shifts.filter(s => new Date(s.startTime).toISOString().split('T')[0] === dStr)
            .reduce((a, s) => a + shiftPlannedH(s), 0);
        });

        // Grand total semaine
        const grandTotalPlanned = shifts.reduce((a, s) => a + shiftPlannedH(s), 0);
        const grandTotalReal    = shifts.reduce((a, s) => a + (shiftRealH(s) ?? 0), 0);

        return (
          <>
            {/* ── Bannière planning avancé ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(137,180,250,0.07)', border: '1px solid rgba(137,180,250,0.2)',
              borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '0.75rem', gap: '1rem',
            }}>
              <span style={{ fontSize: '0.82rem', color: '#89b4fa' }}>
                📅 {t('shifts.advancePlanning')}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#a6adc8' }}>
                {t('shifts.weekOf', { start: weekDates[0].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }), end: weekDates[6].toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) })}
              </span>
            </div>

            <div style={{ overflowX: 'auto', margin: '0 -0.5rem' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              minWidth: '860px',
              tableLayout: 'fixed',
            }}>
              {/* ─── EN-TÊTE ─── */}
              <colgroup>
                <col style={{ width: '200px' }} />
                {weekDates.map((_, i) => <col key={i} style={{ width: '120px' }} />)}
                <col style={{ width: '130px' }} />
              </colgroup>
              <thead>
                <tr>
                  {/* Colonne Employé */}
                  <th style={{
                    background: '#11111b',
                    padding: '0.7rem 1rem',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: '#a6adc8',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '2px solid #313244',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                  }}>
                    👤 {t('shifts.collaborator')}
                  </th>

                  {/* Colonnes Jours */}
                  {weekDates.map((d, i) => {
                    const dStr = d.toISOString().split('T')[0];
                    const isToday = dStr === todayStr;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={i} style={{
                        background: isToday ? 'rgba(137,180,250,0.18)' : isWeekend ? '#13131d' : '#11111b',
                        padding: '0.4rem 0.3rem',
                        textAlign: 'center',
                        borderBottom: isToday ? '2px solid #89b4fa' : '2px solid #313244',
                        borderLeft: '1px solid #313244',
                      }}>
                        <div style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: isToday ? '#89b4fa' : isWeekend ? '#45475a' : '#6c7086',
                          fontWeight: 600,
                        }}>
                          {d.toLocaleDateString('fr-CA', { weekday: 'short' })}
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: isToday ? '#89b4fa' : isWeekend ? '#45475a' : '#cdd6f4',
                          lineHeight: 1.1,
                        }}>
                          {d.getDate()}
                        </div>
                        <div style={{
                          fontSize: '0.62rem',
                          color: isToday ? '#89b4fa' : '#45475a',
                          marginTop: '0.1rem',
                        }}>
                          {d.toLocaleDateString('fr-CA', { month: 'short' })}
                        </div>
                        {isToday && (
                          <div style={{
                            marginTop: '0.2rem',
                            fontSize: '0.58rem',
                            background: '#89b4fa',
                            color: '#11111b',
                            borderRadius: '3px',
                            padding: '0.05rem 0.25rem',
                            fontWeight: 700,
                          }}>{t('shifts.today').toUpperCase()}</div>
                        )}
                        {dayTotals[i] > 0 && (
                          <div style={{ marginTop: '0.2rem', fontSize: '0.62rem', color: '#f9e2af', fontWeight: 600 }}>
                            {dayTotals[i].toFixed(1)}h
                          </div>
                        )}
                      </th>
                    );
                  })}

                  {/* Colonne Résumé */}
                  <th style={{
                    background: '#11111b',
                    padding: '0.7rem 0.4rem',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#a6adc8',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #313244',
                    borderLeft: '1px solid #313244',
                  }}>
                    📊 {t('shifts.weekSummary')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#45475a' }}>
                      {t('shifts.noEmployees')}
                    </td>
                  </tr>
                ) : filteredEmployees.map((emp, rowIdx) => {
                  const stats = empStats(emp.id);
                  const rowBg = rowIdx % 2 === 0 ? '#1e1e2e' : '#181825';
                  return (
                    <tr key={emp.id} style={{ transition: 'background 0.15s' }}>
                      <td style={{
                        background: rowBg,
                        padding: '0.6rem 0.75rem',
                        borderBottom: '1px solid #313244',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #89b4fa, #b4befe)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#11111b',
                            flexShrink: 0,
                          }}>
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: 700,
                              color: '#cdd6f4',
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div style={{
                              fontSize: '0.68rem',
                              color: '#585b70',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {emp.position?.title || t('shifts.noPosition')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ─── CELLULES PAR JOUR ─── */}
                      {weekDates.map((day, dIdx) => {
                        const dayStr = day.toISOString().split('T')[0];
                        const dayShifts = shifts.filter(s => {
                          const sDay = new Date(s.startTime).toISOString().split('T')[0];
                          return s.employeeId === emp.id && sDay === dayStr;
                        });

                        return (
                          <td key={dIdx} style={{
                            background: rowBg,
                            padding: '0.4rem',
                            verticalAlign: 'top',
                            borderBottom: '1px solid #313244',
                            borderLeft: '1px solid #313244',
                          }}>
                            {dayShifts.length === 0 ? (
                              <div
                                style={{
                                  height: '48px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  transition: 'background 0.2s',
                                }}
                                onClick={() => {
                                  setFormEmployeeId(emp.id);
                                  setFormDate(dayStr);
                                  setFormStartHour('08:00');
                                  setFormEndHour('16:00');
                                  setFormLocation(t('shifts.defaultLocation'));
                                  setFormNotes('');
                                  setFormBreak(30);
                                  setSelectedShift(null);
                                  setIsModalOpen(true);
                                }}
                                title={t('shifts.clickToSchedule')}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(166,227,161,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <span style={{ fontSize: '1.1rem', opacity: 0.2 }}>＋</span>
                              </div>
                            ) : (
                              dayShifts.map(shift => {
                                const sc = ({ 
                                    DRAFT: { bg: 'rgba(249,226,175,0.14)', border: '#f9e2af', text: '#f9e2af', label: 'Brouillon' },
                                    SCHEDULED: { bg: 'rgba(137,180,250,0.14)', border: '#89b4fa', text: '#89b4fa', label: t('shifts.statusScheduled') }, 
                                    IN_PROGRESS: { bg: 'rgba(148,226,213,0.14)', border: '#94e2d5', text: '#94e2d5', label: `● ${t('shifts.statusInProgress')}` }, 
                                    COMPLETED: { bg: 'rgba(166,227,161,0.12)', border: '#a6e3a1', text: '#a6e3a1', label: `✓ ${t('shifts.statusCompleted')}` }, 
                                    ABSENT: { bg: 'rgba(243,139,168,0.12)', border: '#f38ba8', text: '#f38ba8', label: t('shifts.statusAbsent') }, 
                                    CANCELLED: { bg: 'rgba(69,71,90,0.3)', border: '#45475a', text: '#585b70', label: t('shifts.statusCancelled') }, 
                                    LATE: { bg: 'rgba(243,139,168,0.12)', border: '#f38ba8', text: '#f38ba8', label: `⚠ ${t('shifts.statusLate')}` } 
                                } as any)[shift.status] ?? { bg: 'rgba(137,180,250,0.1)', border: '#89b4fa', text: '#89b4fa', label: shift.status };
                                const ph = shiftPlannedH(shift);
                                const rh = shiftRealH(shift);
                                return (
                                  <div key={shift.id} onClick={() => handleOpenEditModal(shift)}
                                    style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '6px', padding: '0.35rem 0.45rem', cursor: 'pointer', marginBottom: '0.25rem', transition: 'transform 0.12s, box-shadow 0.12s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 3px 10px rgba(0,0,0,0.35)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: '0.71rem', color: '#cdd6f4', whiteSpace: 'nowrap' }}>
                                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: sc.text, fontWeight: 600, marginTop: '0.1rem' }}>
                                      {sc.label}{shift.isOvertime && <span style={{ marginLeft: '0.3rem', color: '#f9e2af' }}>⚡{t('shifts.overtime')}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: '#6c7086', marginTop: '0.1rem' }}>
                                      {ph.toFixed(1)}h {t('shifts.plannedLabel')}{rh !== null && rh > 0 && <span style={{ color: '#a6e3a1' }}> · {rh.toFixed(1)}h {t('shifts.realLabel')}</span>}
                                    </div>
                                    {shift.actualStartTime && (
                                      <div style={{ fontSize: '0.6rem', color: '#a6e3a1', whiteSpace: 'nowrap' }}>
                                        📥{formatTime(shift.actualStartTime)}{shift.actualEndTime && ` 📤${formatTime(shift.actualEndTime)}`}
                                      </div>
                                    )}
                                    {shift.breakStartTime && (
                                      <div style={{ fontSize: '0.58rem', color: '#f9e2af', whiteSpace: 'nowrap' }}>
                                        {shift.breakEndTime ? (() => { const dm = Math.round((new Date(shift.breakEndTime).getTime() - new Date(shift.breakStartTime!).getTime()) / 60000); return dm > shift.breakDurationMinutes ? <span style={{ color: '#f38ba8' }}>☕+{dm - shift.breakDurationMinutes}m</span> : `☕${dm}m`; })() : <span style={{ fontStyle: 'italic' }}>☕ {t('shifts.onBreak').split(' ').pop()}...</span>}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </td>
                        );
                      })}

                      {/* ─── RÉSUMÉ SEMAINE ─── */}
                      <td style={{ background: rowBg, borderBottom: '1px solid #313244', borderLeft: '1px solid #313244', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#89b4fa' }}>{stats.planned.toFixed(1)}h</div>
                          <div style={{ fontSize: '0.62rem', color: '#45475a' }}>{t('shifts.plannedLabel')}</div>
                          {stats.real > 0 && <>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a6e3a1' }}>{stats.real.toFixed(1)}h</div>
                            <div style={{ fontSize: '0.62rem', color: '#45475a' }}>{t('shifts.realLabel')}</div>
                          </>}
                          <div style={{ fontSize: '0.62rem', color: '#585b70', marginTop: '0.1rem' }}>{stats.completed}/{stats.total} {t('shifts.shiftsCount')}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* ─── FOOTER TOTAUX PAR JOUR ─── */}
              <tfoot>
                <tr>
                  <td style={{ background: '#11111b', padding: '0.55rem 0.75rem', fontWeight: 700, color: '#f9e2af', fontSize: '0.76rem', borderTop: '2px solid #45475a', position: 'sticky', left: 0 }}>
                    🧮 {t('shifts.dayTotal')}
                  </td>
                  {dayTotals.map((h, i) => (
                    <td key={i} style={{ background: '#11111b', padding: '0.4rem 0.3rem', textAlign: 'center', borderTop: '2px solid #45475a', borderLeft: '1px solid #313244' }}>
                      {h > 0
                        ? <span style={{ fontWeight: 700, color: '#f9e2af', fontSize: '0.82rem' }}>{h.toFixed(1)}h</span>
                        : <span style={{ color: '#313244' }}>—</span>}
                    </td>
                  ))}
                  <td style={{ background: '#11111b', padding: '0.4rem', textAlign: 'center', borderTop: '2px solid #45475a', borderLeft: '1px solid #313244' }}>
                    <div style={{ fontWeight: 800, color: '#f9e2af', fontSize: '1rem' }}>{grandTotalPlanned.toFixed(1)}h</div>
                    {grandTotalReal > 0 && <div style={{ fontWeight: 600, color: '#a6e3a1', fontSize: '0.78rem' }}>{grandTotalReal.toFixed(1)}h {t('shifts.realLabel')}</div>}
                    <div style={{ fontSize: '0.6rem', color: '#585b70' }}>{t('shifts.weekSummary')}</div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ── KPI Cards résumé global ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px,1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                { value: `${grandTotalPlanned.toFixed(1)}h`, label: t('shifts.plannedHours'), color: '#89b4fa' },
                ...(grandTotalReal > 0 ? [{ value: `${grandTotalReal.toFixed(1)}h`, label: t('shifts.realHours'), color: '#a6e3a1' }] : []),
                { value: String(shifts.length), label: t('shifts.totalShifts'), color: '#cdd6f4' },
                { value: String(employees.length), label: t('shifts.collaborators'), color: '#b4befe' },
                ...(employees.length > 0 ? [{ value: `${(grandTotalPlanned / employees.length).toFixed(1)}h`, label: t('shifts.avgPerEmployee'), color: '#f9e2af' }] : []),
              ].map(kpi => (
                <div key={kpi.label} style={{ background: '#181825', border: '1px solid #313244', borderRadius: '10px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#585b70', marginTop: '0.2rem' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0.1rem', marginTop: '0.5rem' }}>
              {[['#89b4fa',t('shifts.statusScheduled')],['#94e2d5',t('shifts.statusInProgress')],['#a6e3a1',t('shifts.statusCompleted')],['#f9e2af',t('shifts.onBreak').split(' ')[t('shifts.onBreak').split(' ').length-1]],['#f38ba8',t('shifts.statusAbsent')],['#45475a',t('shifts.statusCancelled')]].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#6c7086' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: c }} />{l}
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#45475a' }}>{t('shifts.clickToSchedule')}</div>
            </div>
          </div>
          </>
        );
      })()}


      {/* ── VUE 2 : ESPACE POINTAGE MOBILE/TERRAIN (EMPLOYÉS) ────────── */}
      {!isManager && (
        <div className={styles.employeeDashboard}>
          {/* Widget Interactif de Pointage */}
          <div className={styles.widgetCard}>
            <div className={styles.clockHeader}>
              <h3>Session de Pointage Actuelle</h3>
              <p>{formatDateLong(new Date())}</p>
            </div>

            {activeShiftForToday ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <strong>{t('shifts.plannedShift')} : </strong>
                  <span style={{color: '#89b4fa'}}>{formatTime(activeShiftForToday.startTime)} - {formatTime(activeShiftForToday.endTime)}</span>
                  <div style={{ fontSize: '0.85rem', color: '#a6adc8', marginTop: '0.25rem' }}>
                     📍 {t('shifts.location')} : {activeShiftForToday.location || t('common.noData')}
                  </div>
                </div>

                {/* Real punch times for current active shift */}
                {(activeShiftForToday.actualStartTime || activeShiftForToday.actualEndTime || activeShiftForToday.breakStartTime) && (
                  <div style={{
                    backgroundColor: '#181825',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    border: '1px solid #313244',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#89b4fa', marginBottom: '0.25rem' }}>⏱️ {t('shifts.realPunches')} :</div>

                    {activeShiftForToday.actualStartTime && (
                      <div style={{ color: '#a6e3a1', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📥 {t('shifts.clockIn')} :</span>
                        <strong>{formatTime(activeShiftForToday.actualStartTime)}</strong>
                      </div>
                    )}

                    {/* Break details */}
                    {activeShiftForToday.breakStartTime && (
                      <div style={{
                        backgroundColor: 'rgba(249,226,175,0.07)',
                        border: '1px solid rgba(249,226,175,0.3)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}>
                        <div style={{ color: '#f9e2af', display: 'flex', justifyContent: 'space-between' }}>
                          <span>☕ {t('shifts.breakStarted')} :</span>
                          <strong>{breakStartStr}</strong>
                        </div>
                        {!activeShiftForToday.breakEndTime && (
                          <div style={{ color: '#a6adc8', display: 'flex', justifyContent: 'space-between' }}>
                            <span>🔔 {t('shifts.breakReturn')} :</span>
                            <strong style={{ color: '#a6e3a1' }}>{returnTimeStr}</strong>
                          </div>
                        )}
                        {activeShiftForToday.breakEndTime && (() => {
                          const diffMin = Math.round((new Date(activeShiftForToday.breakEndTime!).getTime() - new Date(activeShiftForToday.breakStartTime!).getTime()) / 60000);
                          const isExceeded = diffMin > activeShiftForToday.breakDurationMinutes;
                          return (
                            <>
                              <div style={{ color: '#f9e2af', display: 'flex', justifyContent: 'space-between' }}>
                                <span>☕ {t('shifts.breakEnd')} :</span>
                                <strong>{formatTime(activeShiftForToday.breakEndTime)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: isExceeded ? '#f38ba8' : '#a6e3a1', fontWeight: isExceeded ? 700 : 400 }}>
                                <span>{isExceeded ? `⚠️ ${t('shifts.breakExceeded')} :` : `✅ ${t('shifts.breakDuration')} :`}</span>
                                <strong>{diffMin} min {isExceeded ? `(+${diffMin - activeShiftForToday.breakDurationMinutes} ${t('shifts.breakOverflow')})` : `(${t('shifts.breakOk')})`}</strong>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {activeShiftForToday.actualEndTime && (
                      <div style={{ color: '#a6e3a1', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📤 {t('shifts.clockOut')} :</span>
                        <strong>{formatTime(activeShiftForToday.actualEndTime)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {gpsSimulated && (
                  <div className={`${styles.geoIndicator} ${styles.geoActive}`}>
                    <span className={styles.geoDot}></span>
                    📍 Zone de Géofencing validée (Bureau principal détecté à 12m)
                  </div>
                )}

                {pointageSuccessMessage && (
                  <div style={{ color: '#a6e3a1', fontWeight: 600, marginBottom: '1.5rem' }}>
                    {pointageSuccessMessage}
                  </div>
                )}

                {activeShiftForToday.status === 'SCHEDULED' || activeShiftForToday.status === 'LATE' ? (
                  /* ── BOUTON UNIQUE D'ENTRÉE ── */
                  <button className={styles.clockButton} onClick={() => handleOpenScanner('in')}>
                    <span>📸</span>
                    <strong>{t('shifts.clockInBtn')}</strong>
                    <span className={styles.btnTimeText}>{t('shifts.scanQr')}</span>
                  </button>
                ) : activeShiftForToday.status === 'IN_PROGRESS' ? (
                  /* ── QUART EN COURS ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                    {activeShiftForToday.breakStartTime && !activeShiftForToday.breakEndTime ? (
                      /* ── CAS 1 : ACTUELLEMENT EN PAUSE ── */
                      <div style={{
                        backgroundColor: 'rgba(249, 226, 175, 0.1)',
                        border: '1px solid #f9e2af',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                      }}>
                        <div style={{ fontSize: '2.5rem' }}>☕</div>
                        <h4 style={{ color: '#f9e2af', margin: 0 }}>{t('shifts.onBreak')}</h4>
                        
                        <div style={{ fontSize: '0.9rem', color: '#a6adc8' }}>
                          <div>{t('shifts.breakStarted')} : <strong style={{ color: '#eff1f5' }}>{breakStartStr}</strong></div>
                          <div style={{ marginTop: '0.5rem' }}>{t('shifts.breakReturn')} : <strong style={{ color: '#a6e3a1', fontSize: '1.1rem' }}>{returnTimeStr}</strong></div>
                        </div>

                        <button
                          type="button"
                          className={styles.clockButton}
                          style={{
                            background: 'linear-gradient(135deg, #f9e2af 0%, #f38ba8 100%)',
                            color: '#11111b',
                            marginTop: '0.5rem',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(249,226,175,0.3)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={handleEndBreak}
                        >
                          <strong>💪 {t('shifts.endBreakBtn')}</strong>
                        </button>
                      </div>
                    ) : (
                      /* ── CAS 2 : AU TRAVAIL (HORS PAUSE) ── */
                      <>
                        {/* BOUTON UNIQUE DE SORTIE */}
                        <button className={`${styles.clockButton} ${styles.clockButtonOut}`} onClick={() => handleOpenScanner('out')}>
                          <span>📸</span>
                          <strong>{t('shifts.clockOutBtn')}</strong>
                          <span className={styles.btnTimeText}>{t('shifts.scanQr')}</span>
                        </button>

                        {/* BOUTON DÉBUTER LA PAUSE (SI NON PRISE ENCORE) */}
                        {!activeShiftForToday.breakStartTime && (
                          <button
                            type="button"
                            className={styles.clockButton}
                            style={{
                              background: 'linear-gradient(135deg, #a6e3a1 0%, #89b4fa 100%)',
                              color: '#11111b',
                              border: 'none',
                              boxShadow: '0 4px 15px rgba(166,227,161,0.2)',
                              cursor: 'pointer',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}
                            onClick={handleStartBreak}
                          >
                            <strong>☕ {t('shifts.takeBreakBtn')}</strong>
                            <span className={styles.btnTimeText}>({activeShiftForToday.breakDurationMinutes} {t('shifts.breakAllotted')})</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* ── QUART TERMINÉ ── */
                  <div style={{ padding: '1.5rem', backgroundColor: '#181825', borderRadius: '12px', color: '#a6e3a1', fontWeight: 600, textAlign: 'center', width: '100%' }}>
                    🎉 {t('shifts.shiftDone')}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '2rem 0', color: '#a6adc8' }}>
                <span style={{ fontSize: '3rem' }}>💤</span>
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>{t('shifts.noShiftToday')}</p>
              </div>
            )}

            {/* Outils de Simulation GPS pour le test */}
            <div style={{ marginTop: '2.5rem', padding: '1rem', borderTop: '1px solid #313244', width: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={gpsSimulated}
                  onChange={(e) => setGpsSimulated(e.target.checked)}
                />
                {t('shifts.simGeo')}
              </label>
              {gpsSimulated && (
                <div style={{ fontSize: '0.75rem', color: '#a6adc8', marginTop: '0.5rem' }}>
                  {t('shifts.simGeoCoords', { lat: simLat, lng: simLng })}
                </div>
              )}
            </div>
          </div>

          {/* Calendrier liste des shifts personnels de l'employé */}
          <div className={styles.widgetCard} style={{ textAlign: 'left', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <h3 style={{ color: '#89b4fa', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🗓️ {t('shifts.myWeeklyShifts')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {shifts.length > 0 ? (
                shifts.map((s) => {
                  const sDay = new Date(s.startTime);
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#181825',
                        borderLeft: `4px solid ${s.isOvertime ? '#f9e2af' : '#89b4fa'}`,
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>
                          {sDay.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric' })}
                        </strong>
                        <div style={{ fontSize: '0.85rem', color: '#a6adc8', marginTop: '0.2rem' }}>
                          🕒 Planifié : {formatTime(s.startTime)} - {formatTime(s.endTime)}
                        </div>
                        {(s.actualStartTime || s.actualEndTime) && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#a6e3a1',
                            marginTop: '0.25rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            fontFamily: 'monospace'
                          }}>
                            {s.actualStartTime && <span>📥 In: {formatTime(s.actualStartTime)}</span>}
                            {s.actualEndTime && <span>📤 Out: {formatTime(s.actualEndTime)}</span>}
                            {s.breakDurationMinutes > 0 && <span style={{ color: '#f9e2af' }}>☕ Pause: {s.breakDurationMinutes}m</span>}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontWeight: 600,
                          backgroundColor:
                            s.status === 'COMPLETED' ? 'rgba(166,227,161,0.2)' :
                            s.status === 'IN_PROGRESS' ? 'rgba(148,226,213,0.2)' : 'rgba(137,180,250,0.2)',
                          color:
                            s.status === 'COMPLETED' ? '#a6e3a1' :
                            s.status === 'IN_PROGRESS' ? '#94e2d5' : '#89b4fa',
                        }}
                      >
                        {s.status === 'COMPLETED' ? t('shifts.statusCompleted') : s.status === 'IN_PROGRESS' ? t('shifts.statusInProgress') : t('shifts.statusScheduled')}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#a6adc8' }}>
                  {t('shifts.noScheduled')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CRÉATION / ÉDITION SHIFT ────────────────────────────────────── */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <form className={styles.modalContent} onSubmit={handleSaveShift}>
            <div className={styles.modalHeader}>
              <h2>{selectedShift ? `✏️ ${t('shifts.modalEditTitle')}` : `🗓️ ${t('shifts.modalCreateTitle')}`}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className={styles.formGroup}>
              <label>{t('shifts.fieldEmployee')}</label>
              <select
                className={styles.formControl}
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.position?.title || 'Poste'})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('shifts.fieldDate')}</label>
                <input
                  type="date"
                  className={styles.formControl}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('shifts.fieldBreak')}</label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={formBreak}
                  onChange={(e) => setFormBreak(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('shifts.fieldStartTime')}</label>
                <input
                  type="time"
                  className={styles.formControl}
                  value={formStartHour}
                  onChange={(e) => setFormStartHour(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('shifts.fieldEndTime')}</label>
                <input
                  type="time"
                  className={styles.formControl}
                  value={formEndHour}
                  onChange={(e) => setFormEndHour(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>{t('shifts.fieldLocation')}</label>
              <input
                type="text"
                className={styles.formControl}
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>{t('shifts.fieldLat')}</label>
                <input
                  type="number"
                  step="0.000001"
                  className={styles.formControl}
                  value={formLat}
                  onChange={(e) => setFormLat(Number(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('shifts.fieldLng')}</label>
                <input
                  type="number"
                  step="0.000001"
                  className={styles.formControl}
                  value={formLng}
                  onChange={(e) => setFormLng(Number(e.target.value))}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>{t('shifts.fieldNotes')}</label>
              <textarea
                className={styles.formControl}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className={styles.formActions}>
              {selectedShift && (
                <button
                  type="button"
                  style={{ backgroundColor: '#f38ba8', color: '#11111b', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', marginRight: 'auto', fontWeight: 'bold' }}
                  onClick={handleDeleteShift}
                >
                  {t('shifts.btnDelete')}
                </button>
              )}
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsModalOpen(false)}
              >
                {t('shifts.btnCancel')}
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
              >
                {selectedShift ? t('shifts.btnSave') : t('shifts.btnSchedule')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL BORNE QR CODE (STATION POUR GESTIONNAIRES) ── */}
      {showQrStation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px', textAlign: 'center', padding: '2.5rem' }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: '#a6e3a1' }}>📺 {t('shifts.qrStationTitle')}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowQrStation(false)}>×</button>
            </div>
            
            <p style={{ color: '#a6adc8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {t('shifts.qrStationDesc')}
            </p>

            <div style={{
              backgroundColor: '#eff1f5',
              padding: '2rem',
              borderRadius: '12px',
              display: 'inline-block',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              marginBottom: '1.5rem',
            }}>
              {stationToken ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=1e1e2e&bgcolor=eff1f5&data=${encodeURIComponent(stationToken)}`}
                  alt="Secure Workstation QR Code"
                  style={{ width: '260px', height: '260px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e1e2e', fontWeight: 600 }}>
                  {t('shifts.qrGenerating')}
                </div>
              )}
            </div>

            {/* Progress / Freshness Bar */}
            <div style={{ width: '100%', backgroundColor: '#313244', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{
                height: '100%',
                backgroundColor: secondsLeft > 5 ? '#a6e3a1' : '#f38ba8',
                width: `${(secondsLeft / 15) * 100}%`,
                transition: 'width 1s linear, background-color 0.5s ease',
              }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a6adc8' }}>
              <span>🔄 {t('shifts.qrRefresh')}</span>
              <strong style={{ color: secondsLeft > 5 ? '#a6e3a1' : '#f38ba8' }}>{secondsLeft}s</strong>
            </div>

            <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#89b4fa', padding: '0.75rem', backgroundColor: '#181825', borderRadius: '6px' }}>
              🔒 {t('shifts.qrToken')} :
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', marginTop: '0.25rem', color: '#b4befe' }}>
                {stationToken || t('common.noData')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SCANNER QR CODE (ESPACE EMPLOYÉ) ── */}
      {isScanningModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', textAlign: 'center', padding: '2rem' }}>
            <div className={styles.modalHeader}>
              <h2>📸 {t('shifts.scanModalTitle')}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsScanningModalOpen(false)}>×</button>
            </div>

            <p style={{ color: '#a6adc8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {t('shifts.scanModalDesc')}
            </p>

            {/* Viewfinder simulation */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#11111b',
              borderRadius: '12px',
              border: '2px solid #313244',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2rem',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
            }}>
              {/* Red camera dot */}
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#f38ba8', fontWeight: 'bold' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#f38ba8', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite alternate' }}></span>
                CAMERA ACTIVE
              </div>

              {/* Neon Green scanning box */}
              <div style={{
                width: '60%',
                height: '60%',
                border: '2px dashed #a6e3a1',
                borderRadius: '8px',
                position: 'relative',
                boxShadow: '0 0 20px rgba(166,227,161,0.2)',
              }}>
                {/* Laser animation line */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  backgroundColor: '#a6e3a1',
                  boxShadow: '0 0 10px #a6e3a1, 0 0 20px #a6e3a1',
                  animation: 'scanLine 2.5s infinite ease-in-out',
                }}></div>
              </div>

              <div style={{ color: '#a6adc8', fontSize: '0.8rem', marginTop: '1.5rem', zIndex: 2 }}>
                {t('shifts.scanTarget')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #a6e3a1 0%, #94e2d5 100%)',
                  color: '#11111b',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(166,227,161,0.3)',
                }}
                disabled={isSimulatingScan}
                onClick={handleSimulateScan}
              >
                {isSimulatingScan ? t('shifts.scanning') : `✨ ${t('shifts.scanBtn')}`}
              </button>

              <button
                type="button"
                className={styles.btnSecondary}
                style={{ width: '100%', padding: '0.75rem' }}
                onClick={() => setIsScanningModalOpen(false)}
              >
                {t('shifts.btnCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animations Scoped pour le Scanner ── */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
