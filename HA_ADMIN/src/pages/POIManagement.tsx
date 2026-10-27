import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, Edit2, Languages, MapPin, Plus, RefreshCw, Search, Volume2, X,
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, ExternalLink, Compass
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import AudioPlayer from '@/components/AudioPlayer';
import { useToast } from '@/components/toast/ToastProvider';
import { apiMessage } from '@/services/authApi';
import {
  approveTranslation, createPoi, generatePoiAudio, getAdminPois, getPoiAudios, getPoiContent,
  previewTranslations, resolveAudioUrl, resolvePoiImageUrl, reviewPoi, saveTranslation, SUPPORTED_LANGUAGES, updatePoi,
  type AdminPoi, type AudioGenerationResult, type LanguageCode, type PoiContent, type PoiMutation,
} from '@/services/adminContentApi';
import { formatNumber } from '@/utils/helpers';

const targetLanguages = SUPPORTED_LANGUAGES.filter(language => language.code !== 'vi');

type PoiFilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function POIManagement() {
  const { showToast } = useToast();
  const [pois, setPois] = useState<AdminPoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<PoiFilterTab>('ALL');

  // POI Review modals state
  const [reviewingPoi, setReviewingPoi] = useState<AdminPoi | null>(null);
  const [rejectingPoi, setRejectingPoi] = useState<AdminPoi | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [reviewProcessing, setReviewProcessing] = useState(false);

  // POI Edit / Create state
  const [selectedPoi, setSelectedPoi] = useState<AdminPoi | null>(null);
  const [poiEditor, setPoiEditor] = useState<AdminPoi | null | undefined>(undefined);
  const [poiForm, setPoiForm] = useState<PoiFormState>(emptyPoiForm());
  const [poiFormError, setPoiFormError] = useState('');
  const [poiSaving, setPoiSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Multilingual / Audio content state
  const [content, setContent] = useState<PoiContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [drafts, setDrafts] = useState<Partial<Record<LanguageCode, string>>>({});
  const [dirty, setDirty] = useState<Partial<Record<LanguageCode, boolean>>>({});
  const [preview, setPreview] = useState<PoiContentPreview>({});
  const [busy, setBusy] = useState('');
  const [generationResults, setGenerationResults] = useState<AudioGenerationResult[]>([]);
  const [playable, setPlayable] = useState<Partial<Record<LanguageCode, boolean>>>({});

  const loadPois = useCallback(async () => {
    setLoading(true);
    setListError('');
    try { setPois(await getAdminPois()); }
    catch (error) { setListError(apiMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadPois(); }, [loadPois]);

  const loadContent = useCallback(async (poiId: number, initialize = false) => {
    const result = await getPoiContent(poiId);
    setContent(result);
    if (initialize) {
      const source = result.languages.find(item => item.code === 'vi')?.content
        || result.originalDescription || '';
      setSourceText(source);
      setDrafts(Object.fromEntries(result.languages.map(item => [item.code, item.content ?? ''])));
      setDirty({});
      setPreview({});
      setPlayable({});
    }
    return result;
  }, []);

  const openContent = async (poi: AdminPoi) => {
    setSelectedPoi(poi);
    setContent(null);
    setContentError('');
    setContentLoading(true);
    setGenerationResults([]);
    try { await loadContent(poi.id, true); }
    catch (error) { setContentError(apiMessage(error)); }
    finally { setContentLoading(false); }
  };

  const openPoiEditor = (poi: AdminPoi | null) => {
    setPoiFormError('');
    setImageFiles([]);
    setPoiForm(poi ? {
      name: poi.name,
      latitude: String(poi.latitude),
      longitude: String(poi.longitude),
      radius: String(poi.radius),
      priorityLevel: String(poi.priorityLevel),
      originalDescription: poi.originalDescription ?? '',
      directionLink: poi.directionLink ?? '',
      status: poi.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    } : emptyPoiForm());
    setPoiEditor(poi);
  };

  const handlePoiSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const latitude = Number(poiForm.latitude);
    const longitude = Number(poiForm.longitude);
    const radius = Number(poiForm.radius);
    const priorityLevel = Number(poiForm.priorityLevel);
    if (!poiForm.name.trim()) { setPoiFormError('Tên POI là bắt buộc.'); return; }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) { setPoiFormError('Vĩ độ phải nằm trong khoảng -90 đến 90.'); return; }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) { setPoiFormError('Kinh độ phải nằm trong khoảng -180 đến 180.'); return; }
    if (!Number.isInteger(radius) || radius < 1 || radius > 10000) { setPoiFormError('Bán kính phải là số nguyên từ 1 đến 10000 mét.'); return; }
    if (!Number.isInteger(priorityLevel) || priorityLevel < 0 || priorityLevel > 100) { setPoiFormError('Độ ưu tiên phải là số nguyên từ 0 đến 100.'); return; }

    const payload: PoiMutation = {
      name: poiForm.name.trim(), latitude, longitude, radius, priorityLevel,
      originalDescription: poiForm.originalDescription.trim() || null,
      directionLink: poiForm.directionLink.trim() || null,
      status: poiForm.status,
    };
    setPoiSaving(true);
    setPoiFormError('');
    try {
      if (poiEditor) await updatePoi(poiEditor.id, payload, imageFiles);
      else await createPoi(payload, imageFiles);
      setPoiEditor(undefined);
      await loadPois();
      showToast('success', poiEditor ? 'POI đã được cập nhật.' : 'POI đã được tạo và duyệt.');
    } catch (error) { setPoiFormError(apiMessage(error)); }
    finally { setPoiSaving(false); }
  };

  // Duyệt POI
  const handleApprovePoi = async (poi: AdminPoi) => {
    setReviewProcessing(true);
    try {
      await reviewPoi(poi.id, 'APPROVED');
      showToast('success', `Đã phê duyệt POI "${poi.name}".`);
      setPois(current =>
        current.map(item => item.id === poi.id
          ? { ...item, approvalStatus: 'APPROVED', rejectionReason: null }
          : item
        )
      );
      if (reviewingPoi?.id === poi.id) {
        setReviewingPoi(prev => prev ? { ...prev, approvalStatus: 'APPROVED', rejectionReason: null } : null);
      }
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể duyệt POI.');
    } finally {
      setReviewProcessing(false);
    }
  };

  // Từ chối POI kèm lý do
  const handleRejectPoi = async () => {
    if (!rejectingPoi) return;
    if (!rejectionReasonInput.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối POI.');
      return;
    }
    setReviewProcessing(true);
    try {
      await reviewPoi(rejectingPoi.id, 'REJECTED', rejectionReasonInput.trim());
      showToast('success', `Đã từ chối POI "${rejectingPoi.name}".`);
      setPois(current =>
        current.map(item => item.id === rejectingPoi.id
          ? { ...item, approvalStatus: 'REJECTED', rejectionReason: rejectionReasonInput.trim() }
          : item
        )
      );
      if (reviewingPoi?.id === rejectingPoi.id) {
        setReviewingPoi(prev => prev ? { ...prev, approvalStatus: 'REJECTED', rejectionReason: rejectionReasonInput.trim() } : null);
      }
      setRejectingPoi(null);
      setRejectionReasonInput('');
    } catch (error) {
      showToast('error', apiMessage(error) || 'Không thể từ chối POI.');
    } finally {
      setReviewProcessing(false);
    }
  };

  const handleImageSelection = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    const available = 5 - (poiEditor?.images.length ?? 0);
    if (selected.length > available) {
      setPoiFormError(`POI này còn có thể thêm tối đa ${available} hình.`);
      return;
    }
    setPoiFormError('');
    setImageFiles(selected);
  };

  // Lọc POI theo Tab và tìm kiếm
  const counts = useMemo(() => {
    const pending = pois.filter(p => p.approvalStatus === 'PENDING').length;
    const approved = pois.filter(p => p.approvalStatus === 'APPROVED').length;
    const rejected = pois.filter(p => p.approvalStatus === 'REJECTED').length;
    return { all: pois.length, pending, approved, rejected };
  }, [pois]);

  const filtered = useMemo(() => {
    return pois.filter(poi => {
      const matchTab = filterTab === 'ALL' || poi.approvalStatus === filterTab;
      const matchSearch = poi.name.toLowerCase().includes(search.trim().toLowerCase())
        || (poi.originalDescription && poi.originalDescription.toLowerCase().includes(search.trim().toLowerCase()));
      return matchTab && matchSearch;
    });
  }, [pois, filterTab, search]);

  const handlePreview = async () => {
    if (!selectedPoi || !sourceText.trim()) {
      showToast('warning', 'Nhập nội dung tiếng Việt trước khi tạo bản xem trước.');
      return;
    }
    setBusy('preview');
    setPreview({});
    try {
      const response = await previewTranslations(selectedPoi.id, sourceText.trim(), targetLanguages.map(language => language.code));
      setPreview(response.translations);
      setDrafts(current => ({
        ...current,
        ...Object.fromEntries(Object.entries(response.translations)
          .filter(([, result]) => result?.success && result.translatedText)
          .map(([code, result]) => [code, result?.translatedText ?? ''])),
      }));
      setDirty(current => ({
        ...current,
        ...Object.fromEntries(Object.entries(response.translations).filter(([, result]) => result?.success).map(([code]) => [code, true])),
      }));
      if (Object.values(response.translations).some(result => result?.success)) showToast('success', 'Đã nhận bản xem trước. Hãy rà soát trước khi lưu.');
      else showToast('warning', 'LibreTranslate chưa tạo được bản dịch nào.');
    } catch (error) { showToast('error', apiMessage(error)); }
    finally { setBusy(''); }
  };

  const handleSave = async (code: LanguageCode) => {
    if (!selectedPoi) return;
    const value = code === 'vi' ? sourceText : drafts[code] ?? '';
    if (!value.trim()) { showToast('warning', 'Nội dung bản dịch không được để trống.'); return; }
    setBusy(`save:${code}`);
    try {
      await saveTranslation(selectedPoi.id, code, value.trim());
      await loadContent(selectedPoi.id);
      setDrafts(current => ({ ...current, [code]: value.trim() }));
      setDirty(current => ({ ...current, [code]: false }));
      showToast('success', `${languageName(code)} đã lưu và đang chờ duyệt.`);
    } catch (error) { showToast('error', apiMessage(error)); }
    finally { setBusy(''); }
  };

  const handleApprove = async (code: LanguageCode) => {
    if (!selectedPoi) return;
    if (dirty[code] || (code !== 'vi' && dirty.vi)) { showToast('warning', 'Hãy lưu nội dung nguồn và bản dịch đã chỉnh sửa trước khi duyệt.'); return; }
    setBusy(`approve:${code}`);
    try {
      await approveTranslation(selectedPoi.id, code);
      await loadContent(selectedPoi.id);
      showToast('success', `${languageName(code)} đã được backend duyệt.`);
    } catch (error) { showToast('error', apiMessage(error)); }
    finally { setBusy(''); }
  };

  const handleGenerate = async (code: LanguageCode) => {
    if (!selectedPoi) return;
    if (dirty[code] || dirty.vi) { showToast('warning', 'Hãy lưu nội dung nguồn/bản dịch rồi duyệt bản mới nhất trước khi tạo audio.'); return; }
    setBusy(`audio:${code}`);
    setPlayable(current => ({ ...current, [code]: false }));
    try {
      const results = await generatePoiAudio(selectedPoi.id, [code]);
      setGenerationResults(current => [...results, ...current.filter(result => result.languageCode !== code)]);
      const result = results[0];
      if (!result?.success) {
        showToast('error', result?.message || `Không thể tạo audio ${languageName(code)}.`);
        await loadContent(selectedPoi.id);
        return;
      }
      const refreshed = await loadContent(selectedPoi.id);
      const officialAudio = await getPoiAudios(selectedPoi.id, code);
      const canPlay = officialAudio.some(audio => audio.filePath === result.audioUrl);
      setPlayable(current => ({ ...current, [code]: canPlay }));
      if (canPlay && refreshed.languages.find(language => language.code === code)?.status === 'APPROVED') {
        showToast('success', `Audio ${languageName(code)} đã tạo và được API phát audio xác nhận.`);
      } else {
        showToast('warning', 'Audio đã lưu nhưng chưa xuất hiện trong API phát audio đã duyệt.');
      }
    } catch (error) { showToast('error', apiMessage(error)); }
    finally { setBusy(''); }
  };

  const closeContent = () => { setSelectedPoi(null); setContent(null); setContentError(''); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Quản lý POI & Xét duyệt điểm tham quan</h1>
          <p className="text-sm text-brown-500 mt-1">
            Quản lý điểm di tích Hội An, duyệt POI đề xuất từ chủ gian hàng, dịch thuật và phát sinh audio thuyết minh.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void loadPois()} icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} disabled={loading}>
            Tải lại POI
          </Button>
          <Button onClick={() => openPoiEditor(null)} icon={<Plus className="w-4 h-4" />}>
            Thêm POI mới
          </Button>
        </div>
      </div>

      <Card noPadding>
        {/* Tab & Search Filter */}
        <div className="p-4 border-b border-brown-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterTab === 'ALL'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Tất cả POI ({counts.all})
            </button>

            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filterTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              <span>Yêu cầu duyệt từ gian hàng</span>
              {counts.pending > 0 && (
                <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
                  filterTab === 'PENDING' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterTab === 'APPROVED'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Đã duyệt ({counts.approved})
            </button>

            <button
              onClick={() => setFilterTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterTab === 'REJECTED'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-brown-50 text-brown-600 hover:bg-brown-100'
              }`}
            >
              Bị từ chối ({counts.rejected})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm POI theo tên hoặc mô tả…"
              className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-brown-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Đang tải danh sách POI từ backend…</p>
          </div>
        ) : listError ? (
          <div className="px-4 py-8 text-center">
            <p role="alert" className="mb-3 text-sm text-red-600">{listError}</p>
            <Button variant="secondary" onClick={() => void loadPois()}>Thử lại</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-brown-400">
            <MapPin className="w-10 h-10 mx-auto text-brown-300 mb-2" />
            <p>Không có POI nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-brown-100 bg-brown-50/50">
                  <th className="px-4 py-3.5 text-left font-semibold text-brown-600 text-xs uppercase tracking-wider">Điểm tham quan (POI)</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-brown-600 text-xs uppercase tracking-wider">Tọa độ GPS</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">Bán kính</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-brown-600 text-xs uppercase tracking-wider">Xét duyệt</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-brown-600 text-xs uppercase tracking-wider">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-50">
                {filtered.map(poi => (
                  <tr key={poi.id} className="hover:bg-brown-50/30 transition-colors">
                    {/* Tên POI & Ảnh */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {poi.images && poi.images[0] ? (
                          <img
                            src={resolvePoiImageUrl(poi.images[0])}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover border border-brown-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-brown-100 flex items-center justify-center text-brown-400 flex-shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div
                            className="font-semibold text-brown-900 hover:text-primary-600 cursor-pointer"
                            onClick={() => setReviewingPoi(poi)}
                          >
                            {poi.name}
                          </div>
                          <div className="text-xs text-brown-400 flex items-center gap-2 mt-0.5">
                            <span>ID #{poi.id}</span>
                            <span>·</span>
                            <span>{poi.images ? poi.images.length : 0} hình</span>
                            {poi.directionLink && (
                              <>
                                <span>·</span>
                                <a
                                  href={poi.directionLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:underline inline-flex items-center gap-0.5"
                                >
                                  Chỉ đường <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tọa độ */}
                    <td className="px-4 py-3 text-xs text-brown-600 font-mono">
                      {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                    </td>

                    {/* Bán kính */}
                    <td className="px-4 py-3 text-center text-brown-600 font-medium">
                      {poi.radius} m
                    </td>

                    {/* Trạng thái hoạt động */}
                    <td className="px-4 py-3 text-center">
                      <Badge variant={poi.status === 'ACTIVE' ? 'active' : 'inactive'}>
                        {poi.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>

                    {/* Trạng thái duyệt */}
                    <td className="px-4 py-3 text-center">
                      {poi.approvalStatus === 'APPROVED' ? (
                        <Badge variant="active">Đã duyệt</Badge>
                      ) : poi.approvalStatus === 'PENDING' ? (
                        <Badge variant="partial">Chờ duyệt</Badge>
                      ) : (
                        <span title={poi.rejectionReason || 'Đã bị từ chối'}>
                          <Badge variant="skipped" className="cursor-pointer">
                            Bị từ chối
                          </Badge>
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Nút Xem xét & Duyệt cho POI PENDING */}
                        {poi.approvalStatus === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setReviewingPoi(poi)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Thẩm định
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => void handleApprovePoi(poi)}
                              icon={<Check className="w-3.5 h-3.5" />}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setRejectingPoi(poi);
                                setRejectionReasonInput('');
                              }}
                              icon={<X className="w-3.5 h-3.5" />}
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReviewingPoi(poi)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openPoiEditor(poi)}
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void openContent(poi)}
                              icon={<Languages className="w-3.5 h-3.5" />}
                            >
                              Nội dung & Audio
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-brown-100 text-xs text-brown-500 flex justify-between items-center">
              <span>Hiển thị {formatNumber(filtered.length)} / {formatNumber(pois.length)} điểm tham quan POI</span>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: THẨM ĐỊNH & XEM CHI TIẾT POI GIAN HÀNG */}
      <Modal
        open={reviewingPoi !== null}
        onClose={() => setReviewingPoi(null)}
        title={reviewingPoi ? `Thẩm định POI: ${reviewingPoi.name}` : ''}
        size="lg"
        footer={
          reviewingPoi && (
            <div className="flex items-center justify-between w-full">
              <div>
                {reviewingPoi.approvalStatus === 'PENDING' && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    POI đang chờ duyệt kích hoạt
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setReviewingPoi(null)}>
                  Đóng
                </Button>
                {reviewingPoi.approvalStatus === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setRejectingPoi(reviewingPoi);
                        setRejectionReasonInput('');
                      }}
                      icon={<X className="w-4 h-4" />}
                    >
                      Từ chối
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => void handleApprovePoi(reviewingPoi)}
                      icon={<Check className="w-4 h-4" />}
                      disabled={reviewProcessing}
                    >
                      {reviewProcessing ? 'Đang duyệt…' : 'Phê duyệt POI'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {reviewingPoi && (
          <div className="space-y-5">
            {/* Cảnh báo lý do từ chối nếu có */}
            {reviewingPoi.approvalStatus === 'REJECTED' && reviewingPoi.rejectionReason && (
              <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 flex gap-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Lý do từ chối POI trước đó:</p>
                  <p className="mt-0.5 text-red-700">{reviewingPoi.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Thông số kỹ thuật GPS & Kích hoạt */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brown-50/60 p-3.5 rounded-xl border border-brown-100">
              <div>
                <span className="text-[11px] text-brown-400 uppercase font-semibold">Vĩ độ (Lat)</span>
                <p className="text-sm font-mono font-medium text-brown-800 mt-0.5">{reviewingPoi.latitude}</p>
              </div>
              <div>
                <span className="text-[11px] text-brown-400 uppercase font-semibold">Kinh độ (Lng)</span>
                <p className="text-sm font-mono font-medium text-brown-800 mt-0.5">{reviewingPoi.longitude}</p>
              </div>
              <div>
                <span className="text-[11px] text-brown-400 uppercase font-semibold">Bán kính Geofence</span>
                <p className="text-sm font-semibold text-primary-700 mt-0.5">{reviewingPoi.radius} mét</p>
              </div>
              <div>
                <span className="text-[11px] text-brown-400 uppercase font-semibold">Độ ưu tiên phát</span>
                <p className="text-sm font-semibold text-brown-800 mt-0.5">{reviewingPoi.priorityLevel}</p>
              </div>
            </div>

            {/* Mô tả gốc */}
            <div>
              <h4 className="text-sm font-semibold text-brown-800 mb-1.5">Mô tả điểm tham quan / gian hàng</h4>
              <p className="text-sm text-brown-700 bg-white p-3.5 rounded-lg border border-brown-200 leading-relaxed whitespace-pre-line">
                {reviewingPoi.originalDescription || 'Chưa có thông tin mô tả chi tiết.'}
              </p>
            </div>

            {/* Liên kết chỉ đường */}
            {reviewingPoi.directionLink && (
              <div>
                <span className="text-xs text-brown-500 font-medium">Liên kết chỉ đường Google Maps:</span>
                <a
                  href={reviewingPoi.directionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-primary-600 hover:underline truncate"
                >
                  {reviewingPoi.directionLink}
                </a>
              </div>
            )}

            {/* Gallery ảnh POI */}
            <div>
              <h4 className="text-sm font-semibold text-brown-800 mb-2">Hình ảnh POI đính kèm ({reviewingPoi.images.length})</h4>
              {reviewingPoi.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {reviewingPoi.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={resolvePoiImageUrl(img)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-brown-200 hover:opacity-90 transition-opacity aspect-video bg-brown-50"
                    >
                      <img
                        src={resolvePoiImageUrl(img)}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-lg border border-dashed border-brown-200 text-xs text-brown-400">
                  POI này chưa có hình ảnh đính kèm.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: TỪ CHỐI POI KÈM LÝ DO */}
      <Modal
        open={rejectingPoi !== null}
        onClose={() => !reviewProcessing && setRejectingPoi(null)}
        title="Từ chối yêu cầu duyệt POI"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectingPoi(null)}
              disabled={reviewProcessing}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleRejectPoi()}
              disabled={reviewProcessing}
              icon={<X className="w-4 h-4" />}
            >
              {reviewProcessing ? 'Đang xử lý…' : 'Xác nhận từ chối'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brown-700">
            Điểm tham quan: <strong>{rejectingPoi?.name}</strong> (ID #{rejectingPoi?.id})
          </p>
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1">
              Lý do từ chối POI * (chủ gian hàng sẽ xem được lý do này)
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReasonInput}
              onChange={e => setRejectionReasonInput(e.target.value)}
              placeholder="Nhập lý do POI chưa đạt yêu cầu (vd: Tọa độ GPS lệch khỏi ranh giới, mô tả chứa từ ngữ quảng cáo quá đà...)"
              className="w-full rounded-lg border border-brown-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <span className="text-xs text-brown-400 block mb-1.5">Gợi ý lý do nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Tọa độ GPS không chính xác so với thực tế',
                'Bán kính quét quá rộng gây chồng lấn điểm di sản',
                'Nội dung mô tả chưa đúng quy chuẩn văn hóa',
                'Hình ảnh tải lên mờ, không rõ biển hiệu'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReasonInput(reason)}
                  className="text-xs px-2.5 py-1 rounded bg-brown-50 hover:bg-brown-100 text-brown-700 border border-brown-200 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: THÊM / SỬA POI */}
      <Modal
        open={poiEditor !== undefined}
        onClose={() => setPoiEditor(undefined)}
        title={poiEditor ? `Sửa POI: ${poiEditor.name}` : 'Thêm POI mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPoiEditor(undefined)} disabled={poiSaving}>
              Hủy
            </Button>
            <button
              form="poi-editor-form"
              type="submit"
              disabled={poiSaving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {poiSaving ? 'Đang lưu…' : poiEditor ? 'Lưu thay đổi' : 'Tạo POI'}
            </button>
          </>
        }
      >
        <form id="poi-editor-form" onSubmit={event => void handlePoiSave(event)} className="space-y-4">
          {poiFormError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{poiFormError}</p>}
          <label className="block text-sm font-medium text-brown-700">Tên POI *<input required maxLength={200} value={poiForm.name} onChange={event => setPoiForm(form => ({ ...form, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-brown-700">Vĩ độ *<input required type="number" min={-90} max={90} step="0.000001" value={poiForm.latitude} onChange={event => setPoiForm(form => ({ ...form, latitude: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-brown-700">Kinh độ *<input required type="number" min={-180} max={180} step="0.000001" value={poiForm.longitude} onChange={event => setPoiForm(form => ({ ...form, longitude: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-brown-700">Bán kính (m) *<input required type="number" min={1} max={10000} step={1} value={poiForm.radius} onChange={event => setPoiForm(form => ({ ...form, radius: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
            <label className="text-sm font-medium text-brown-700">Độ ưu tiên<input required type="number" min={0} max={100} step={1} value={poiForm.priorityLevel} onChange={event => setPoiForm(form => ({ ...form, priorityLevel: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
          </div>
          <label className="block text-sm font-medium text-brown-700">Mô tả gốc<textarea maxLength={10000} rows={4} value={poiForm.originalDescription} onChange={event => setPoiForm(form => ({ ...form, originalDescription: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-medium text-brown-700">Liên kết chỉ đường<input maxLength={500} value={poiForm.directionLink} onChange={event => setPoiForm(form => ({ ...form, directionLink: event.target.value }))} className="mt-1 w-full rounded-lg border border-brown-200 px-3 py-2 text-sm" /></label>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brown-700">Hình ảnh (tối đa 5)<input type="file" accept="image/jpeg,image/png,image/gif,image/bmp" multiple disabled={(poiEditor?.images.length ?? 0) >= 5} onChange={event => handleImageSelection(event.target.files)} className="mt-1 block w-full text-sm" /></label>
            {!!poiEditor?.images.length && <div className="flex flex-wrap gap-2">{poiEditor.images.map((path, index) => <img key={path} src={resolvePoiImageUrl(path)} alt={`POI ${index + 1}`} className="h-16 w-16 rounded object-cover" />)}</div>}
            {imageFiles.length > 0 && <p className="text-xs text-brown-500">Ảnh mới: {imageFiles.map(file => file.name).join(', ')}</p>}
            <p className="text-xs text-brown-400">Ảnh hiện có được giữ lại; mỗi file tối đa 10 MB.</p>
          </div>
          <label className="block text-sm font-medium text-brown-700">Trạng thái<select value={poiForm.status} onChange={event => setPoiForm(form => ({ ...form, status: event.target.value as PoiFormState['status'] }))} className="mt-1 w-full rounded-lg border border-brown-200 bg-white px-3 py-2 text-sm"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select></label>
        </form>
      </Modal>

      {/* MODAL 4: NỘI DUNG ĐA NGÔN NGỮ & TẠO AUDIO */}
      <Modal open={!!selectedPoi} onClose={closeContent} title={selectedPoi ? `Nội dung: ${selectedPoi.name}` : 'Nội dung POI'} size="xl">
        {contentLoading && <p className="text-sm text-brown-500">Đang tải trạng thái nội dung…</p>}
        {contentError && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{contentError}</div>}
        {content && selectedPoi && <div className="space-y-6">
          {!!selectedPoi?.images.length && <section className="rounded-xl border border-brown-100 p-4 space-y-3"><h2 className="text-sm font-semibold text-brown-800">Hình ảnh POI</h2><div className="flex flex-wrap gap-3">{selectedPoi.images.map((path, index) => <img key={path} src={resolvePoiImageUrl(path)} alt={`${selectedPoi.name} ${index + 1}`} className="h-24 w-32 rounded-lg object-cover" />)}</div></section>}
          <section className="rounded-xl border border-brown-100 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-brown-800"><MapPin className="w-4 h-4 text-primary-600" /> Nội dung nguồn tiếng Việt</div>
            <textarea value={sourceText} maxLength={10000} onChange={event => {
              setSourceText(event.target.value);
              setDirty(current => ({ ...current, vi: true }));
            }} rows={4} aria-label="Nội dung tiếng Việt" className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" placeholder="Nhập nội dung tiếng Việt cần dịch…" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brown-400"><span>{sourceText.length}/10000</span><span>Bản xem trước không được lưu cho tới khi chọn Lưu.</span></div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handlePreview()} disabled={Boolean(busy)} icon={<Languages className="w-4 h-4" />}>{busy === 'preview' ? 'Đang dịch…' : 'Xem trước bản dịch'}</Button>
              <Button variant="secondary" onClick={() => void handleSave('vi')} disabled={Boolean(busy)}>{busy === 'save:vi' ? 'Đang lưu…' : 'Lưu tiếng Việt'}</Button>
              <Button variant="secondary" onClick={() => void handleApprove('vi')} disabled={Boolean(busy) || dirty.vi || content.languages.find(language => language.code === 'vi')?.status !== 'PENDING'}>{busy === 'approve:vi' ? 'Đang duyệt…' : 'Duyệt tiếng Việt'}</Button>
              <Button onClick={() => void handleGenerate('vi')} disabled={Boolean(busy) || dirty.vi || content.languages.find(language => language.code === 'vi')?.status !== 'APPROVED'} icon={<Volume2 className="w-4 h-4" />}>{busy === 'audio:vi' ? 'Đang tạo audio…' : 'Tạo audio tiếng Việt'}</Button>
            </div>
            <p className="text-xs text-brown-500">Trạng thái tiếng Việt: {dirty.vi ? 'Có chỉnh sửa chưa lưu' : statusLabel(content.languages.find(language => language.code === 'vi')?.status ?? null)}</p>
            {generationResults.find(result => result.languageCode === 'vi') && <p role={generationResults.find(result => result.languageCode === 'vi')?.success ? undefined : 'alert'} className="text-xs text-brown-600">{generationResults.find(result => result.languageCode === 'vi')?.message}</p>}
            {(() => {
              const audioUrl = content.languages.find(language => language.code === 'vi')?.audioUrl;
              return audioUrl && !dirty.vi
                ? <AudioPlayer title="Tiếng Việt · POI hiện tại" src={resolveAudioUrl(audioUrl) ?? ''} />
                : audioUrl && dirty.vi ? <p className="text-xs text-amber-700">Audio cũ đang bị ẩn vì nội dung nguồn đã chỉnh sửa; hãy lưu và duyệt lại trước khi phát.</p> : null;
            })()}
          </section>

          {targetLanguages.map(language => {
            const data = content.languages.find(item => item.code === language.code);
            const result = preview[language.code];
            const isDirty = Boolean(dirty[language.code]);
            const approved = data?.status === 'APPROVED' && !isDirty;
            const audioResult = generationResults.find(item => item.languageCode === language.code);
            return <section key={language.code} className="rounded-xl border border-brown-100 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-brown-800">{language.name} <span className="text-xs font-normal text-brown-400">({language.code})</span></h2>
                <div className="flex items-center gap-2"><Badge variant={data?.status === 'APPROVED' && !isDirty ? 'active' : data?.status === 'PENDING' || isDirty ? 'partial' : 'inactive'}>{isDirty ? 'Có chỉnh sửa chưa lưu' : statusLabel(data?.status ?? null)}</Badge>{!data?.active && <Badge variant="inactive">Ngôn ngữ tắt</Badge>}</div>
              </div>
              <textarea value={drafts[language.code] ?? ''} maxLength={10000} onChange={event => {
                setDrafts(current => ({ ...current, [language.code]: event.target.value }));
                setDirty(current => ({ ...current, [language.code]: true }));
              }} rows={3} aria-label={`Bản dịch ${language.name}`} className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" placeholder="Bản dịch sẽ xuất hiện sau khi xem trước; bạn có thể nhập/chỉnh sửa tại đây." />
              {result && <p className={`text-xs ${result.success ? 'text-green-700' : 'text-red-600'}`} role={result.success ? undefined : 'alert'}>{result.success ? 'Đã có bản xem trước — cần lưu để gửi duyệt.' : `Dịch thất bại: ${result.error || 'LibreTranslate không trả bản dịch.'}`}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={Boolean(busy) || !drafts[language.code]?.trim()} onClick={() => void handleSave(language.code)}>{busy === `save:${language.code}` ? 'Đang lưu…' : 'Lưu bản dịch'}</Button>
                <Button size="sm" variant="secondary" disabled={Boolean(busy) || !data?.content || data.status !== 'PENDING' || isDirty || dirty.vi || !data.active} onClick={() => void handleApprove(language.code)}>{busy === `approve:${language.code}` ? 'Đang duyệt…' : 'Duyệt bản dịch'}</Button>
                <Button size="sm" disabled={Boolean(busy) || !approved || dirty.vi || !data?.active} onClick={() => void handleGenerate(language.code)} icon={<Volume2 className="w-4 h-4" />}>{busy === `audio:${language.code}` ? 'Đang tạo audio…' : 'Tạo / kiểm tra audio'}</Button>
              </div>
              {audioResult && <p className={`text-xs ${audioResult.success ? 'text-brown-600' : 'text-red-600'}`} role={audioResult.success ? undefined : 'alert'}>{audioResult.message}{audioResult.success && audioResult.durationSeconds != null ? ` · ${audioResult.durationSeconds} giây` : ''}</p>}
              {data?.audioUrl && (isDirty || dirty.vi)
                ? <p className="text-xs text-amber-700">Audio cũ đang bị ẩn cho tới khi nội dung mới được lưu và duyệt.</p>
                : data?.audioUrl && <><p className="text-xs text-brown-500">{playable[language.code] ? 'API audio công khai đã xác nhận metadata.' : `Voice audio: ${language.name} · thời lượng backend ${data.durationSeconds ?? '—'} giây`}</p><AudioPlayer title={`${language.name} · ${selectedPoi.name}`} src={resolveAudioUrl(data.audioUrl) ?? ''} /></>}
            </section>;
          })}
        </div>}
      </Modal>
    </div>
  );
}

type PoiContentPreview = Partial<Record<LanguageCode, { success: boolean; translatedText: string | null; error: string | null }>>;

interface PoiFormState {
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
  priorityLevel: string;
  originalDescription: string;
  directionLink: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function emptyPoiForm(): PoiFormState {
  return {
    name: '', latitude: '', longitude: '', radius: '30', priorityLevel: '0',
    originalDescription: '', directionLink: '', status: 'ACTIVE',
  };
}

function statusLabel(status: string | null) {
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'PENDING') return 'Chờ duyệt';
  return 'Chưa có bản dịch';
}

function languageName(code: string) {
  return SUPPORTED_LANGUAGES.find(language => language.code === code)?.name ?? code;
}
