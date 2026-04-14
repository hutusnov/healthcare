import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Alert } from '../components/common';
import { format } from 'date-fns';

export const ViewDoctorSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('all'); // all, available, booked

  // pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    availableCount: 0,
    bookedCount: 0,
    page: 1,
    pages: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchSlots(1);
  }, []);

  const fetchSlots = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await adminAPI.getDoctorSlots({
        page: pageToLoad,
        limit: 50,
      });

      const data = response.data?.data ?? response.data;
      const slotsList = data?.slots ?? data;
      const list = Array.isArray(slotsList) ? slotsList : [];

      setSlots(list);

      const pg = data.pagination || {};
      setPagination({
        total: pg.total ?? list.length,
        availableCount:
          pg.availableCount ?? list.filter((s) => !s.isBooked).length,
        bookedCount:
          pg.bookedCount ?? list.filter((s) => s.isBooked).length,
        page: pg.page ?? pageToLoad,
        pages: pg.pages ?? 1,
        limit: pg.limit ?? 50,
      });
      setPage(pg.page ?? pageToLoad);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load doctor slots',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'ID copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const filteredSlots = slots.filter((slot) => {
    if (filter === 'available') return !slot.isBooked;
    if (filter === 'booked') return slot.isBooked;
    return true;
  });

  const handlePrev = () => {
    if (pagination.page > 1) {
      fetchSlots(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.pages) {
      fetchSlots(pagination.page + 1);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Slots</h1>
        <Button onClick={() => fetchSlots(page)}>Refresh</Button>
      </div>

      {message.text && (
        <div className="mb-4">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        </div>
      )}

      {/* filter + count dùng tổng toàn bộ */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({pagination.total})
        </Button>
        <Button
          variant={filter === 'available' ? 'success' : 'outline'}
          onClick={() => setFilter('available')}
        >
          Available ({pagination.availableCount})
        </Button>
        <Button
          variant={filter === 'booked' ? 'danger' : 'outline'}
          onClick={() => setFilter('booked')}
        >
          Booked ({pagination.bookedCount})
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Specialty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Start
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      End
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSlots.map((slot) => {
                    const duration = Math.round(
                      (new Date(slot.end) - new Date(slot.start)) / (1000 * 60)
                    );
                    return (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">
                          <button
                            onClick={() => copyToClipboard(slot.id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            title="Click to copy"
                          >
                            {slot.id.slice(0, 8)}...
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {slot.doctor?.user?.fullName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {slot.doctor?.specialty || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(slot.start), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(slot.end), 'HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {duration} min
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              slot.isBooked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(slot.id)}
                          >
                            Copy ID
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filter === 'available'
                    ? 'No available slots'
                    : filter === 'booked'
                    ? 'No booked slots'
                    : 'No doctor slots found. Create one first!'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t mt-2">
                <div className="text-sm text-gray-600">
                  Page <strong>{pagination.page}</strong> of{' '}
                  <strong>{pagination.pages}</strong> · Total:{' '}
                  <strong>{pagination.total}</strong> slots
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {slots.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Slots on this page:</strong> {slots.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-600">
              <strong>Available (this page):</strong>{' '}
              {slots.filter((s) => !s.isBooked).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-red-600">
              <strong>Booked (this page):</strong>{' '}
              {slots.filter((s) => s.isBooked).length}
            </p>
          </div>
          <div className="col-span-3">
            <p className="text-sm text-gray-600 mt-1">
              <strong>Tip:</strong> Click on any ID to copy it to clipboard.
              Only available slots can be used for new appointments.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
