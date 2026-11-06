import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, Hash, ListPlus, Lock, Plus, SquareCheck, Type, X } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import CollapsibleField from './CollapsibleField';

const MAX_CUSTOM_FIELDS = 5;
const TYPES = [
  { id: 'TEXT', Icon: Type },
  { id: 'NUMBER', Icon: Hash },
  { id: 'DATE', Icon: Calendar },
  { id: 'BOOLEAN', Icon: SquareCheck },
];
const TYPE_ICONS = Object.fromEntries(TYPES.map(({ id, Icon }) => [id, Icon]));

/**
 * Botão de ícone que escolhe o tipo do campo. O menu vai pro <body> com
 * position: fixed, senão a rolagem do modal cortava ele.
 */
function TypeMenu({ value, onChange, locked, labels }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const button = useRef(null);
  const menu = useRef(null);
  const Icon = TYPE_ICONS[value] ?? Type;

  useLayoutEffect(() => {
    if (!open || !button.current || !menu.current) return;
    const anchor = button.current.getBoundingClientRect();
    const height = menu.current.offsetHeight;
    const below = anchor.bottom + 6;
    setPos({ left: anchor.left, top: below + height > window.innerHeight - 8 ? anchor.top - 6 - height : below });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!button.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); button.current?.focus(); } };
    // o menu fica fixo na tela: se o modal rolar, fecha em vez de ficar solto
    const onScroll = (event) => { if (!menu.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="rk-ftype"
        title={locked ? labels.typeLocked : `${labels.typeLabel}: ${labels.types[value]}`}
        aria-label={`${labels.typeLabel}: ${labels.types[value]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={locked}
        onClick={() => { setPos(null); setOpen(v => !v); }}
      >
        <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
        {locked ? <Lock size={11} strokeWidth={2} aria-hidden="true" /> : <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />}
      </button>
      {open && createPortal(
        <div ref={menu} className="mr-menu rk-ftype-menu" role="menu" aria-label={labels.typeLabel}
          style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
          {TYPES.map(({ id, Icon: OptionIcon }) => (
            <button key={id} type="button" role="menuitemradio" aria-checked={id === value} className="mr-menu-item"
              onClick={() => { onChange(id); setOpen(false); button.current?.focus(); }}>
              <OptionIcon size={15} strokeWidth={1.8} aria-hidden="true" />
              {labels.types[id]}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Campos próprios do Personalizado (até 5), numa linha que abre e fecha. Campo que
 * já existe tem `id` e não troca de tipo (o backend recusa); renomear e remover pode.
 */
export default function CustomFieldsEditor({ value, onChange, disabled = false }) {
  const { t } = useLanguage();
  const tc = t.rankings.customFields;
  const [open, setOpen] = useState(false);
  // campo recém-adicionado já recebe o cursor
  const [focusIndex, setFocusIndex] = useState(null);

  const update = (index, patch) => onChange(value.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  const add = () => {
    setFocusIndex(value.length);
    onChange([...value, { name: '', type: 'TEXT' }]);
  };
  const canAdd = value.length < MAX_CUSTOM_FIELDS;


  const names = value.map(field => field.name.trim()).filter(Boolean);
  const summary = open
    ? tc.count.replace('{n}', value.length).replace('{max}', MAX_CUSTOM_FIELDS)
    : names.length === 0
      ? tc.none
      : names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');

  return (
    <CollapsibleField icon={ListPlus} title={tc.label} summary={summary} open={open} onToggle={() => setOpen(v => !v)}>
      {value.length > 0 && (
        <ul className="rk-fields">
          {value.map((field, index) => (
            <li key={field.id ?? `new-${index}`}>
              <TypeMenu value={field.type} onChange={type => update(index, { type })} locked={disabled || !!field.id} labels={tc} />
              <input
                className="rk-fields-name"
                value={field.name}
                placeholder={tc.namePlaceholder}
                maxLength={40}
                autoFocus={index === focusIndex}
                onChange={event => update(index, { name: event.target.value })}
                onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (canAdd) add(); } }}
                disabled={disabled}
              />
              <button type="button" className="rk-icon-btn is-danger" aria-label={tc.remove} title={tc.remove}
                onClick={() => onChange(value.filter((_, i) => i !== index))} disabled={disabled}>
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rk-coll-foot">
        {canAdd && (
          <button type="button" className="mr-btn mr-btn-ghost mr-btn-sm rk-add-link" onClick={add} disabled={disabled}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {tc.add}
          </button>
        )}
        <p className="mr-field-hint">{tc.emptyHint}</p>
      </div>
    </CollapsibleField>
  );
}
