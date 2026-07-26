import { useEffect, useState } from 'react';

import KpiCard from '../../components/common/KpiCard';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';

import { getSites } from '../../api/site.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

function PendingSupply() {
    const [sites, setSites] = useState([]);
    const [siteId, setSiteId] = useState('');

    const [pendingRows, setPendingRows] = useState([]);

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingPending, setLoadingPending] = useState(true);
    const [errorPending, setErrorPending] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setLoadingSites(true);
                const data = await getSites();
                setSites(data || []);
            } catch (err) {
                console.error('Gagal memuat daftar site', err);
                setSites([]);
            } finally {
                setLoadingSites(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoadingPending(true);
                setErrorPending(null);
                const params = {};
                if (siteId) params.site_id = siteId;
                const data = await getPendingSupply(params);
                setPendingRows(data || []);
            } catch (err) {
                console.error('Gagal memuat data pending supply', err);
                setErrorPending('Gagal memuat data dari server. Silakan coba lagi.');
                setPendingRows([]);
            } finally {
                setLoadingPending(false);
            }
        })();
    }, [siteId]);

    const totalQty = pendingRows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);

    return (
        <div>
            <div className="mb-3">
                <h4 className="fw-semibold mb-1">Pending Supply</h4>
                <p className="text-secondary mb-0">Daftar part yang masih menunggu kedatangan/pengiriman.</p>
            </div>

            <FilterBar
                sites={sites}
                siteId={siteId}
                onSiteChange={setSiteId}
                showMonthFilter={false}
                showYearFilter={false}
            />

            <div className="row g-3 mb-3">
                <div className="col-6 col-md-3">
                    <KpiCard
                        icon="bi-box-seam"
                        label="Total Item Pending"
                        value={loadingPending ? '' : pendingRows.length}
                        loading={loadingPending || loadingSites}
                        variant="warning"
                    />
                </div>
                <div className="col-6 col-md-3">
                    <KpiCard
                        icon="bi-boxes"
                        label="Total Qty Pending"
                        value={loadingPending ? '' : totalQty}
                        loading={loadingPending || loadingSites}
                        variant="primary"
                    />
                </div>
            </div>

            {errorPending && (
                <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-exclamation-triangle" />
                    <span>{errorPending}</span>
                </div>
            )}

            <DataTable
                title="Daftar Pending Supply"
                loading={loadingPending}
                data={pendingRows}
                rowKey="id"
                emptyMessage="Belum ada data pending supply"
                columns={[
                    { key: 'site_code', label: 'Site' },
                    { key: 'parts_number', label: 'Parts Number' },
                    { key: 'description', label: 'Description' },
                    { key: 'qty', label: 'Qty', align: 'right' },
                    { key: 'no_po', label: 'No PO' },
                    {
                        key: 'eta',
                        label: 'ETA',
                        render: (row) => (row.eta ? new Date(row.eta).toLocaleDateString('id-ID') : '-'),
                    },
                    { key: 'remarks', label: 'Remarks' },
                ]}
            />
        </div>
    );
}

export default PendingSupply;