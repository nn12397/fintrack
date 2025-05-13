import React, { useEffect, useState } from 'react';
import { getDebitCards, createDebitCard, updateDebitCard, deleteDebitCard } from '../services/debit-card-service';
import type { DebitCard } from '../types';
import { AlertTriangle, Plus, Pencil, Trash2, Building2, CreditCard, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DebitCardForm from '../components/debit-cards/DebitCardForm';

const DebitCardsPage: React.FC = () => {
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DebitCard | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDebitCards = async () => {
    try {
      setIsLoading(true);
      const data = await getDebitCards();
      setDebitCards(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load debit cards');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebitCards();
  }, []);

  const handleSubmit = async (formData: Partial<DebitCard>) => {
    try {
      setIsSubmitting(true);
      if (selectedCard) {
        await updateDebitCard(selectedCard.id, formData);
      } else {
        await createDebitCard(formData);
      }
      setIsModalOpen(false);
      await fetchDebitCards();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (card: DebitCard) => {
    if (!confirm('Are you sure you want to delete this debit card?')) {
      return;
    }

    try {
      await deleteDebitCard(card.id);
      await fetchDebitCards();
    } catch (err: any) {
      setError(err.message || 'Failed to delete debit card');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-500">
        <AlertTriangle className="mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Debit Cards</h1>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedCard(undefined);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus size={20} />}
        >
          Add Debit Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debitCards.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {card.bank_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    •••• {card.last_four_digits}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setIsModalOpen(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="p-1 hover:bg-red-100 rounded-full text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{card.name}</span>
                  </div>
                  {card.is_primary && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(card.available_balance)}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Account Type</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {card.account_type}
                    </span>
                  </div>

                  {card.auto_reload_enabled && (
                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Auto-reload Settings
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Threshold</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(card.auto_reload_threshold || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Reload Amount</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(card.auto_reload_amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCard ? 'Edit Debit Card' : 'Add Debit Card'}
        size="lg"
      >
        <DebitCardForm
          card={selectedCard}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default DebitCardsPage;