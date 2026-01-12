import React, { useState } from 'react';
import { Holding } from '@baseline/types/holding';
import { StockQuote } from '@baseline/types/stock';
import styles from './SellModal.module.scss';

interface SellModalProps {
  holding: Holding;
  stockQuote: StockQuote;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (symbol: string, quantity: number) => Promise<void>;
}

const SellModal = ({
  holding,
  stockQuote,
  isOpen,
  onClose,
  onConfirm,
}: SellModalProps): JSX.Element | null => {
  const [quantity, setQuantity] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quantityNum = parseInt(quantity) || 0;
  const totalProceeds = quantityNum * stockQuote.regularMarketPrice;
  const canSell = quantityNum > 0 && quantityNum <= holding.quantity;

  const handleConfirm = async () => {
    setError(null);

    // Validation
    if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
      setError('Please enter a positive whole number');
      return;
    }

    if (quantityNum > holding.quantity) {
      setError(`You only own ${holding.quantity} shares`);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(holding.symbol, quantityNum);
      onClose();
      setQuantity('1');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sell stock';
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
          <h2>Sell {stockQuote.shortName}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.stockInfo}>
            <span className={styles.symbol}>
              {holding.symbol.replace('.AX', '')}
            </span>
            <span className={styles.price}>
              ${stockQuote.regularMarketPrice.toFixed(2)}
            </span>
          </div>

          <div className={styles.ownership}>
            <span>You own:</span>
            <span className={styles.sharesOwned}>
              {holding.quantity.toLocaleString()} shares
            </span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="quantity">Quantity (shares to sell)</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={holding.quantity}
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
              <span>${stockQuote.regularMarketPrice.toFixed(2)}</span>
            </div>
            <div className={styles.row}>
              <span>Quantity:</span>
              <span>{quantityNum}</span>
            </div>
            <div className={`${styles.row} ${styles.total}`}>
              <span>You will receive:</span>
              <span className={styles.proceeds}>
                ${totalProceeds.toFixed(2)}
              </span>
            </div>
            {quantityNum > holding.quantity && (
              <div className={styles.insufficientShares}>
                You only own {holding.quantity} shares
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
            onClick={handleConfirm}
            disabled={loading || !canSell}
          >
            {loading ? 'Processing...' : 'Confirm Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
