import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Input, Select, Alert } from '../components/common';

export const AddDoctorSlot = () => {
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    startTime: '',
    endTime: '',
    numberOfSlots: 1,
    slotDuration: 30, // phút / slot
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.numberOfSlots,
    formData.slotDuration,
  ]);

  const fetchDoctors = async () => {
    try {
      const response = await adminAPI.getDoctors();
      const data = response.data.data || response.data;
      const doctorsList = data.doctors || data;
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      setDoctors([]);
    }
  };

  const generatePreview = () => {
    const { date, startTime, endTime, numberOfSlots, slotDuration } = formData;

    if (!date || !startTime || !endTime) {
      setPreview([]);
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setPreview([]);
      return;
    }

    if (startDateTime >= endDateTime) {
      setPreview([]);
      return;
    }

    const slots = [];

    // Nếu m muốn chia đều theo numberOfSlots:
    if (numberOfSlots && numberOfSlots > 0) {
      const totalMinutes = (endDateTime - startDateTime) / (1000 * 60);
      const perSlot = totalMinutes / numberOfSlots;

      let cursor = new Date(startDateTime);
      for (let i = 0; i < numberOfSlots; i++) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(slotStart.getTime() + perSlot * 60 * 1000);
        if (slotEnd > endDateTime) break;

        slots.push({
          start: slotStart,
          end: slotEnd,
          duration: Math.round(perSlot),
        });

        cursor = slotEnd;
      }
    } else {
      // Nếu muốn chia theo slotDuration (phòng khi m chỉnh sau này)
      const duration = Number(slotDuration) || 30;
      let cursor = new Date(startDateTime);
      while (cursor < endDateTime) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
        if (slotEnd > endDateTime) break;

        slots.push({
          start: slotStart,
          end: slotEnd,
          duration,
        });

        cursor = slotEnd;
      }
    }

    setPreview(slots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.doctorId) {
      setMessage({ type: 'error', text: 'Please select a doctor' });
      setLoading(false);
      return;
    }

    if (preview.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in all fields correctly' });
      setLoading(false);
      return;
    }

    try {
      const payloads = preview.map((slot) => ({
        doctorId: formData.doctorId,
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }));

      console.log('Creating slots with payloads:', payloads);

      const promises = payloads.map((body) => adminAPI.createDoctorSlot(body));
      await Promise.all(promises);

      setMessage({
        type: 'success',
        text: `Successfully created ${preview.length} doctor slots!`,
      });

      setFormData({
        doctorId: '',
        date: '',
        startTime: '',
        endTime: '',
        numberOfSlots: 1,
        slotDuration: 30,
      });
      setPreview([]);
    } catch (error) {
      console.error('Create slot error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create doctor slots',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Doctor Slots</h1>

      {message.text && (
        <div className="mb-4">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Slot Configuration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Doctor"
              required
              value={formData.doctorId}
              onChange={(e) =>
                setFormData({ ...formData, doctorId: e.target.value })
              }
              options={[
                { value: '', label: 'Select Doctor...' },
                ...doctors.map((doc) => ({
                  value: doc.id, // user.id (đúng với backend)
                  label: `${doc.fullName || 'Unknown'} - ${
                    doc.doctor?.specialty || 'No specialty'
                  }`,
                })),
              ]}
            />

            <Input
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                required
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
              <Input
                label="End Time"
                type="time"
                required
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </div>

            <Input
              label="Number of Slots"
              type="number"
              required
              min="1"
              max="50"
              value={formData.numberOfSlots}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfSlots: parseInt(e.target.value, 10) || 1,
                })
              }
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> The time range will be divided into{' '}
                {formData.numberOfSlots} equal slots. Each slot will be
                approximately {preview.length > 0 ? preview[0].duration : 0}{' '}
                minutes.
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create {formData.numberOfSlots}{' '}
              Slot{formData.numberOfSlots > 1 ? 's' : ''}
            </Button>
          </form>
        </Card>

        {/* Preview */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Slots Preview</h2>
          {preview.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {preview.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {slot.duration} minutes
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Available
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>Fill in the form to preview slots</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Total:</strong> {preview.length} slots will be created
                on{' '}
                {formData.date
                  ? new Date(formData.date).toLocaleDateString()
                  : ''}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
