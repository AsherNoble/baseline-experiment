import React, { useState } from 'react';
import { StockQuote } from '@baseline/types/stock';
import { Portfolio } from '@baseline/types/portfolio';
import styles from './BuyModal.module.scss';

interface BuyModalProps {
  stock: StockQuote;
  portfolio: Portfolio;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (symbol: string, quantity: number) => Promise<void>;
}

const BuyModal = ({
  stock,
  portfolio,
  isOpen,
  onClose,
  onConfirm,
}: BuyModalProps): JSX.Element | null => {
  const [quantity, setQuantity] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quantityNum = parseInt(quantity) || 0;
  const totalCost = quantityNum * stock.regularMarketPrice;
  const canAfford = totalCost <= portfolio.cash;

  const handleConfirm = async () => {
    setError(null);

    // Validation
    if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
      setError('Please enter a positive whole number');
      return;
    }

    if (!canAfford) {
      setError('Insufficient funds');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(stock.symbol, quantityNum);
      onClose();
      setQuantity('1');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to purchase stock';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      setError(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Buy {stock.shortName}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.stockInfo}>
            <span className={styles.symbol}>
              {stock.symbol.replace('.AX', '')}
            </span>
            <span className={styles.price}>
              ${stock.regularMarketPrice.toFixed(2)}
            </span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="quantity">Quantity (shares)</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className={styles.calculation}>
            <div className={styles.row}>
              <span>Price per share:</span>
              <span>${stock.regularMarketPrice.toFixed(2)}</span>
            </div>
            <div className={styles.row}>
              <span>Quantity:</span>
              <span>{quantityNum}</span>
            </div>
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total Cost:</span>
              <span className={!canAfford ? styles.error : ''}>
                ${totalCost.toFixed(2)}
              </span>
            </div>
            <div className={styles.row}>
              <span>Available Cash:</span>
              <span>${portfolio.cash.toFixed(2)}</span>
            </div>
            {!canAfford && (
              <div className={styles.insufficientFunds}>
                Insufficient funds (need $
                {(totalCost - portfolio.cash).toFixed(2)} more)
              </div>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={() => void handleConfirm()}
            disabled={loading || !canAfford || quantityNum <= 0}
          >
            {loading ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyModal;
