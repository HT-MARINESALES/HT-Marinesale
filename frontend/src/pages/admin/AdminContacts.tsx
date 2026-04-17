import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MailOpen, Mail, ExternalLink, Inbox, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ContactRequest, PaginatedResponse } from '@/types';

export function AdminContacts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactRequest | null>(null);
  const [showUnread, setShowUnread] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', { page, unread: showUnread }],
    queryFn: () => api.get<PaginatedResponse<ContactRequest>>(
      `/admin/contacts?page=${page}&limit=20${showUnread ? '&unread=true' : ''}`
    ),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: unreadData } = useQuery({
    queryKey: ['admin-contacts', { unread: true }],
    queryFn: () => api.get<PaginatedResponse<ContactRequest>>('/admin/contacts?unread=true&limit=1'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const unreadCount = unreadData?.total || 0;

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/admin/contacts/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const handleOpen = (contact: ContactRequest) => {
    setSelected(contact);
    if (!contact.is_read) {
      markRead.mutate(contact.id);
    }
  };

  const contacts = data?.data || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Kontaktanfragen</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-bold bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showUnread}
            onChange={(e) => { setShowUnread(e.target.checked); setPage(1); }}
            className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
          />
          <span className="text-sm text-gray-600">Nur ungelesene anzeigen</span>
        </label>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {data?.total || 0} Anfrage{data?.total !== 1 ? 'n' : ''}
            {unreadCount > 0 && <span className="text-red-600 font-medium"> · {unreadCount} ungelesen</span>}
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Inbox className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Keine Anfragen vorhanden</p>
                {showUnread && <p className="text-sm mt-1">Alle Nachrichten wurden gelesen.</p>}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contacts.map((contact: ContactRequest) => (
                  <div
                    key={contact.id}
                    onClick={() => handleOpen(contact)}
                    className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!contact.is_read ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {contact.is_read
                        ? <MailOpen className="h-5 w-5 text-gray-400" />
                        : <Mail className="h-5 w-5 text-blue-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${!contact.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {contact.name}
                        </span>
                        <span className="text-xs text-gray-400">{contact.email}</span>
                        {!contact.is_read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {(contact.listings as any)?.title && (
                        <span className="inline-block text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full mb-1">
                          {(contact.listings as any).title}
                        </span>
                      )}
                      <p className="text-sm text-gray-500 truncate">{contact.message.substring(0, 120)}</p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(contact.created_at)}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteContact.mutate(contact.id); }}
                      className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition-colors ml-2"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Zurück</Button>
              <span className="text-sm text-gray-600">Seite {page} von {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Weiter</Button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Nachricht von ${selected?.name || ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name: </span>
                <span className="font-medium">{selected.name}</span>
              </div>
              <div>
                <span className="text-gray-500">E-Mail: </span>
                <a href={`mailto:${selected.email}`} className="text-navy-600 hover:underline">{selected.email}</a>
              </div>
              {selected.phone && (
                <div>
                  <span className="text-gray-500">Telefon: </span>
                  <a href={`tel:${selected.phone}`} className="text-navy-600 hover:underline">{selected.phone}</a>
                </div>
              )}
              {selected.listings && (
                <div>
                  <span className="text-gray-500">Inserat: </span>
                  <Link
                    to={`/admin/inserate/${selected.listing_id}`}
                    className="text-navy-600 hover:underline inline-flex items-center gap-1"
                    onClick={() => setSelected(null)}
                  >
                    {(selected.listings as any).title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Nachricht:</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selected.message}
              </div>
            </div>
            <div className="text-xs text-gray-400">{formatDateTime(selected.created_at)}</div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>Schließen</Button>
              <Button
                variant="destructive"
                onClick={() => { deleteContact.mutate(selected!.id); setSelected(null); }}
              >
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
              <a href={`mailto:${selected.email}?subject=Re: Ihre Anfrage bei HT-Marineservice`}>
                <Button>
                  <Mail className="h-4 w-4" />
                  Antworten
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
