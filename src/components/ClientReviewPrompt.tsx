import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Star, X } from 'lucide-react';
import { db } from '../firebase';
import type { Booking } from '../types';
import {
  sortBookingsNewestFirst,
  subscribeToClientBookings,
} from '../services/bookingService';
import { addReview } from '../services/reviewService';

export default function ClientReviewPrompt({ userId }: { userId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let disposed = false;

    const unsubscribe = subscribeToClientBookings(userId, (bookings) => {
      void (async () => {
        const closed = sortBookingsNewestFirst(bookings).filter(
          (item) => item.estado_servicio === 'cerrado'
        );

        for (const candidate of closed) {
          if (sessionStorage.getItem(`ugo-review-dismissed:${candidate.id}`) === '1') continue;

          const review = await getDoc(doc(db, 'avaliacoes', candidate.id));
          if (!review.exists()) {
            if (!disposed) {
              setBooking(candidate);
              setRating(5);
              setComment('');
            }
            return;
          }
        }

        if (!disposed) setBooking(null);
      })();
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [userId]);

  if (!booking) return null;

  const dismiss = () => {
    sessionStorage.setItem(`ugo-review-dismissed:${booking.id}`, '1');
    setBooking(null);
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);

    try {
      await addReview(
        booking.id,
        booking.proveedorId,
        userId,
        rating,
        comment
      );
      setBooking(null);
    } catch (error) {
      console.error('No se pudo guardar la reseña:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-quantum-card p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-quantum-cyan">
              Servicio cerrado
            </p>
            <h2 className="mt-1 text-xl font-bold">¿Cómo estuvo el profesional?</h2>
            <p className="mt-1 text-sm text-white/45">
              {booking.proveedorNombre || 'Profesional UGO'}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Calificar más tarde"
            className="rounded-full p-2 text-white/45 hover:bg-white/10 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setRating(value)}
              className="rounded-full p-1.5 transition-transform hover:scale-110"
              aria-label={`${value} estrellas`}
            >
              <Star
                size={30}
                className={
                  value <= rating
                    ? 'fill-quantum-cyan text-quantum-cyan'
                    : 'text-white/20'
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, 500))}
          maxLength={500}
          placeholder="Comentario opcional"
          className="mt-5 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-quantum-cyan/50"
        />

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="mt-4 w-full rounded-2xl bg-quantum-cyan px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Enviar calificación'}
        </button>
      </div>
    </div>
  );
}
