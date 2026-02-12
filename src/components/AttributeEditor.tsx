type Props = {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
};

export default function AttributesEditor({ value, onChange }: Props) {
  const entries = Object.entries(value || {});

  const updateKey = (oldKey: string, newKey: string) => {
    const v = { ...value };
    const val = v[oldKey];
    delete v[oldKey];
    if (newKey) v[newKey] = val;
    onChange(v);
  };

  const updateValue = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  const remove = (key: string) => {
    const v = { ...value };
    delete v[key];
    onChange(v);
  };

  const add = () => {
    onChange({ ...value, "": "" });
  };

  return (
    <div className="attributes-editor">
      {entries.map(([k, v], i) => (
        <div key={i} className="attr-row">
          <input
            placeholder="Attribute"
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
          />
          <input
            placeholder="Value"
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
          />
          <button onClick={() => remove(k)}>✕</button>
        </div>
      ))}

      <button type="button" className="add-attr" onClick={add}>
        + Add attribute
      </button>
    </div>
  );
}
