import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { OptionGroup, OptionChoice } from '../../types';

interface OptionGroupsEditorProps {
  optionGroups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}

interface PresetTemplate {
  name: string;
  description: string;
  icon: string;
  group: OptionGroup;
}

export const PRESET_OPTION_TEMPLATES: PresetTemplate[] = [
  {
    name: 'ขนาด / ความพิเศษ (ธรรมดา / พิเศษ)',
    description: 'ตัวเลือกขนาด เช่น ธรรมดา, พิเศษ, จัมโบ้',
    icon: '📏',
    group: {
      id: 'group_size',
      name: 'ขนาด / ปริมาณ',
      nameEn: 'Portion Size',
      required: true,
      maxSelect: 1,
      choices: [
        { id: 'size_reg', name: 'ธรรมดา (Normal)', priceDelta: 0 },
        { id: 'size_spec', name: 'พิเศษ (Special)', priceDelta: 20 },
        { id: 'size_jumbo', name: 'จัมโบ้ (Jumbo)', priceDelta: 40 },
      ],
    },
  },
  {
    name: 'สิ่งที่ไม่ใส่ / ข้อยกเว้น (No / Exclude)',
    description: 'เลือกสิ่งที่ไม่ต้องการใส่ เช่น ไม่ใส่ผัก, ไม่ใส่พริก',
    icon: '🚫',
    group: {
      id: 'group_exclusions',
      name: 'สิ่งที่ไม่ใส่ (Exclusions)',
      nameEn: 'Special Requests / No Additions',
      required: false,
      maxSelect: 6,
      choices: [
        { id: 'ex_veg', name: 'ไม่ใส่ผัก', priceDelta: 0 },
        { id: 'ex_cilantro', name: 'ไม่ใส่ต้นหอม / ผักชี', priceDelta: 0 },
        { id: 'ex_chili', name: 'ไม่ใส่พริก (ไม่เผ็ด)', priceDelta: 0 },
        { id: 'ex_garlic', name: 'ไม่ใส่กระเทียม / เจียว', priceDelta: 0 },
        { id: 'ex_msg', name: 'ไม่ใส่ผงชูรส', priceDelta: 0 },
        { id: 'ex_sugar', name: 'ไม่ใส่น้ำตาล', priceDelta: 0 },
      ],
    },
  },
  {
    name: 'ระดับความเผ็ด (Spiciness Level)',
    description: 'เลือกระดับความเผ็ดของจานอาหาร',
    icon: '🌶️',
    group: {
      id: 'group_spicy',
      name: 'ระดับความเผ็ด',
      nameEn: 'Spiciness Level',
      required: true,
      maxSelect: 1,
      choices: [
        { id: 'spicy_none', name: 'ไม่เผ็ดเลย (0/5)', priceDelta: 0 },
        { id: 'spicy_mild', name: 'เผ็ดน้อย (1/5)', priceDelta: 0 },
        { id: 'spicy_med', name: 'เผ็ดปานกลาง (มาตรฐาน) (2/5)', priceDelta: 0 },
        { id: 'spicy_hot', name: 'เผ็ดมาก (3/5)', priceDelta: 0 },
        { id: 'spicy_fire', name: 'เผ็ดพ่นไฟจัดจ้าน (5/5)', priceDelta: 0 },
      ],
    },
  },
  {
    name: 'เพิ่มท็อปปิ้ง / เครื่องเคียง (Add-ons)',
    description: 'เพิ่มไข่ดาว, ชีส, เนื้อสัตว์, ข้าวสวย',
    icon: '🍳',
    group: {
      id: 'group_addons',
      name: 'เพิ่มท็อปปิ้ง & เครื่องเคียง',
      nameEn: 'Add-ons & Extra Toppings',
      required: false,
      maxSelect: 5,
      choices: [
        { id: 'add_egg_fried', name: 'เพิ่มไข่ดาวกรอบ', priceDelta: 15 },
        { id: 'add_egg_boiled', name: 'เพิ่มไข่ต้มยางมะตูม', priceDelta: 15 },
        { id: 'add_cheese', name: 'เพิ่มมอสซาเรลล่าชีส', priceDelta: 30 },
        { id: 'add_meat', name: 'เพิ่มเนื้อสัตว์ x2', priceDelta: 45 },
        { id: 'add_rice', name: 'เพิ่มข้าวสวยหอมมะลิ', priceDelta: 15 },
      ],
    },
  },
  {
    name: 'ระดับความหวาน & น้ำแข็ง (Drinks)',
    description: 'สำหรับเครื่องดื่ม เลือกระดับความหวาน',
    icon: '🧋',
    group: {
      id: 'group_sweetness',
      name: 'ระดับความหวาน',
      nameEn: 'Sweetness Level',
      required: true,
      maxSelect: 1,
      choices: [
        { id: 'sw_0', name: 'ไม่หวานเลย (0%)', priceDelta: 0 },
        { id: 'sw_25', name: 'หวานน้อยมาก (25%)', priceDelta: 0 },
        { id: 'sw_50', name: 'หวานน้อย (50%)', priceDelta: 0 },
        { id: 'sw_100', name: 'หวานปกติ (100%)', priceDelta: 0 },
        { id: 'sw_no_ice', name: 'แยกน้ำแข็ง / ไม่ใส่น้ำแข็ง', priceDelta: 0 },
      ],
    },
  },
];

export const OptionGroupsEditor: React.FC<OptionGroupsEditorProps> = ({
  optionGroups,
  onChange,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Add a preset template
  const handleApplyPreset = (template: PresetTemplate) => {
    const newGroup: OptionGroup = {
      ...template.group,
      id: `og_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      choices: template.group.choices.map((c, i) => ({
        ...c,
        id: `opt_${Date.now()}_${i}`,
      })),
    };
    onChange([...optionGroups, newGroup]);
  };

  // Add custom group
  const handleAddCustomGroup = () => {
    const newGroup: OptionGroup = {
      id: `og_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'กลุ่มตัวเลือกใหม่',
      nameEn: 'Custom Options',
      required: false,
      maxSelect: 3,
      choices: [
        { id: `opt_${Date.now()}_1`, name: 'ตัวเลือกที่ 1', priceDelta: 0 },
        { id: `opt_${Date.now()}_2`, name: 'ตัวเลือกที่ 2 (พิเศษ)', priceDelta: 20 },
      ],
    };
    onChange([...optionGroups, newGroup]);
  };

  // Update group properties
  const handleUpdateGroup = (index: number, updates: Partial<OptionGroup>) => {
    const updated = [...optionGroups];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  // Remove group
  const handleRemoveGroup = (index: number) => {
    const updated = optionGroups.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Add choice to group
  const handleAddChoice = (groupIndex: number) => {
    const updated = [...optionGroups];
    const group = updated[groupIndex];
    const newChoice: OptionChoice = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'ตัวเลือกเพิ่มเติม',
      priceDelta: 0,
    };
    group.choices = [...group.choices, newChoice];
    onChange(updated);
  };

  // Update choice
  const handleUpdateChoice = (
    groupIndex: number,
    choiceIndex: number,
    updates: Partial<OptionChoice>
  ) => {
    const updated = [...optionGroups];
    const group = updated[groupIndex];
    const updatedChoices = [...group.choices];
    updatedChoices[choiceIndex] = { ...updatedChoices[choiceIndex], ...updates };
    group.choices = updatedChoices;
    onChange(updated);
  };

  // Remove choice
  const handleRemoveChoice = (groupIndex: number, choiceIndex: number) => {
    const updated = [...optionGroups];
    const group = updated[groupIndex];
    group.choices = group.choices.filter((_, i) => i !== choiceIndex);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Template Suggestions */}
      <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5C00]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              ⚡ เพิ่มเทมเพลตตัวเลือกสำเร็จรูป (1-Click Presets)
            </h4>
          </div>
          <span className="text-[10px] text-stone-400">กดเพื่อเพิ่มตัวเลือก</span>
        </div>

        {/* Preset Badges */}
        <div className="flex flex-wrap gap-2">
          {PRESET_OPTION_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0A0B] hover:bg-[#FF5C00]/20 border border-white/10 hover:border-[#FF5C00]/50 text-xs text-stone-200 hover:text-white font-bold transition-all cursor-pointer group"
            >
              <span>{tmpl.icon}</span>
              <span>{tmpl.name}</span>
              <Plus className="w-3 h-3 text-[#FF5C00] group-hover:scale-120 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Existing Option Groups List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF5C00]" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              กลุ่มตัวเลือกของเมนูนี้ ({optionGroups.length} กลุ่ม)
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddCustomGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างกลุ่มตัวเลือกเอง</span>
          </button>
        </div>

        {optionGroups.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#0A0A0B] border border-dashed border-white/10 text-stone-500 text-xs">
            <p className="font-bold text-stone-400">ยังไม่มีตัวเลือกย่อยสำหรับเมนูนี้</p>
            <p className="text-[11px] mt-1">
              คลิกปุ่มเทมเพลตด้านบน หรือกด "สร้างกลุ่มตัวเลือกเอง" เพื่อเพิ่มตัวเลือก เช่น พิเศษ/ธรรมดา, สิ่งที่ไม่ใส่, หรือท็อปปิ้ง
            </p>
          </div>
        ) : (
          optionGroups.map((group, gIdx) => {
            const isCollapsed = collapsedGroups[group.id];

            return (
              <div
                key={group.id || gIdx}
                className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/15 space-y-3 shadow-md"
              >
                {/* Group Top Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#FF5C00]/20 text-[#FF5C00] text-xs font-black flex items-center justify-center font-mono">
                      {gIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleUpdateGroup(gIdx, { name: e.target.value })}
                      placeholder="ชื่อกลุ่มตัวเลือก เช่น ขนาด / สิ่งที่ไม่ใส่"
                      className="font-bold text-sm text-white bg-transparent border-b border-white/20 focus:border-[#FF5C00] focus:outline-none px-1 py-0.5 w-full max-w-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Required / Optional Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateGroup(gIdx, {
                          required: !group.required,
                          maxSelect: !group.required ? 1 : 5,
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        group.required
                          ? 'bg-[#FF5C00] text-white'
                          : 'bg-[#161618] text-stone-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {group.required ? 'จำเป็นต้องเลือก (Single)' : 'เลือกได้หลายอย่าง (Multi)'}
                    </button>

                    {/* Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(group.id)}
                      className="p-1.5 rounded-lg bg-[#161618] text-stone-400 hover:text-white transition-colors"
                    >
                      {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Group */}
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(gIdx)}
                      className="p-1.5 rounded-lg bg-[#161618] text-stone-400 hover:text-rose-400 transition-colors"
                      title="ลบกลุ่มนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Group Body (Choices) */}
                {!isCollapsed && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-medium">
                      <span>รายการตัวเลือกย่อย</span>
                      <span>ราคาบวกเพิ่ม (+฿)</span>
                    </div>

                    {group.choices.map((choice, cIdx) => (
                      <div
                        key={choice.id || cIdx}
                        className="flex items-center gap-2 bg-[#161618] p-2 rounded-xl border border-white/10"
                      >
                        <span className="text-stone-500 text-xs font-mono pl-1">
                          {cIdx + 1}.
                        </span>
                        
                        {/* Choice Name */}
                        <input
                          type="text"
                          value={choice.name}
                          onChange={(e) =>
                            handleUpdateChoice(gIdx, cIdx, { name: e.target.value })
                          }
                          placeholder="ชื่อตัวเลือก เช่น ไม่ใส่ผัก, พิเศษ (+20)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0A0A0B] border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#FF5C00] font-medium"
                        />

                        {/* Price Delta Input */}
                        <div className="flex items-center gap-1 bg-[#0A0A0B] border border-white/10 px-2 py-1.5 rounded-lg">
                          <span className="text-[11px] font-mono text-[#FF5C00] font-bold">+฿</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={choice.priceDelta}
                            onChange={(e) =>
                              handleUpdateChoice(gIdx, cIdx, {
                                priceDelta: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-14 text-xs font-mono font-bold text-white bg-transparent focus:outline-none text-right"
                          />
                        </div>

                        {/* Delete Choice */}
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(gIdx, cIdx)}
                          className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                          title="ลบตัวเลือกนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add choice button */}
                    <button
                      type="button"
                      onClick={() => handleAddChoice(gIdx)}
                      className="w-full py-2 rounded-xl bg-[#161618] hover:bg-[#202024] border border-dashed border-white/15 text-stone-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF5C00]" />
                      <span>+ เพิ่มตัวเลือกในกลุ่มนี้</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
