import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '@/lib/theme';

type DateTimeFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
};

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showWeb, setShowWeb] = useState(false);

  const displayDate = value ? value.toLocaleDateString() : 'Sin fecha';
  const displayTime = value
    ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Sin hora';

  const baseDate = value ?? new Date();

  const years = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, idx) => year - 1 + idx);
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, idx) => idx + 1), []);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, idx) => idx), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, idx) => idx), []);

  const [webYear, setWebYear] = useState(baseDate.getFullYear());
  const [webMonth, setWebMonth] = useState(baseDate.getMonth() + 1);
  const [webDay, setWebDay] = useState(baseDate.getDate());
  const [webHour, setWebHour] = useState(baseDate.getHours());
  const [webMinute, setWebMinute] = useState(baseDate.getMinutes());

  const openWebPicker = () => {
    const seed = value ?? new Date();
    setWebYear(seed.getFullYear());
    setWebMonth(seed.getMonth() + 1);
    setWebDay(seed.getDate());
    setWebHour(seed.getHours());
    setWebMinute(seed.getMinutes());
    setShowWeb(true);
  };

  const commitWeb = () => {
    const next = new Date(webYear, webMonth - 1, webDay, webHour, webMinute);
    onChange(next);
    setShowWeb(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => (Platform.OS === 'web' ? openWebPicker() : setShowDate(true))}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Fecha</Text>
          <Text style={styles.buttonValue}>{displayDate}</Text>
        </Pressable>
        <Pressable
          onPress={() => (Platform.OS === 'web' ? openWebPicker() : setShowTime(true))}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Hora</Text>
          <Text style={styles.buttonValue}>{displayTime}</Text>
        </Pressable>
      </View>
      <Text style={styles.valueHint}>Selecciona fecha y hora exactas.</Text>

      {Platform.OS !== 'web' && showDate ? (
        <DateTimePicker
          value={baseDate}
          mode="date"
          onChange={(_, selected) => {
            setShowDate(false);
            if (!selected) return;
            const current = value ?? new Date();
            const merged = new Date(
              selected.getFullYear(),
              selected.getMonth(),
              selected.getDate(),
              current.getHours(),
              current.getMinutes(),
            );
            onChange(merged);
          }}
        />
      ) : null}

      {Platform.OS !== 'web' && showTime ? (
        <DateTimePicker
          value={baseDate}
          mode="time"
          onChange={(_, selected) => {
            setShowTime(false);
            if (!selected) return;
            const current = value ?? new Date();
            const merged = new Date(
              current.getFullYear(),
              current.getMonth(),
              current.getDate(),
              selected.getHours(),
              selected.getMinutes(),
            );
            onChange(merged);
          }}
        />
      ) : null}

      {Platform.OS === 'web' ? (
        <Modal transparent visible={showWeb} animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Selecciona fecha y hora</Text>
              <View style={styles.modalSections}>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Fecha</Text>
                  <View style={styles.pickerRow}>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={webYear}
                        onValueChange={setWebYear}
                        style={styles.picker}
                      >
                        {years.map((year) => (
                          <Picker.Item key={year} label={String(year)} value={year} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={webMonth}
                        onValueChange={setWebMonth}
                        style={styles.picker}
                      >
                        {months.map((month) => (
                          <Picker.Item key={month} label={String(month)} value={month} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={webDay}
                        onValueChange={setWebDay}
                        style={styles.picker}
                      >
                        {Array.from(
                          { length: new Date(webYear, webMonth, 0).getDate() },
                          (_, idx) => idx + 1,
                        ).map((day) => (
                          <Picker.Item key={day} label={String(day)} value={day} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Hora</Text>
                  <View style={styles.pickerRow}>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={webHour}
                        onValueChange={setWebHour}
                        style={styles.picker}
                      >
                        {hours.map((hour) => (
                          <Picker.Item
                            key={hour}
                            label={String(hour).padStart(2, '0')}
                            value={hour}
                          />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={webMinute}
                        onValueChange={setWebMinute}
                        style={styles.picker}
                      >
                        {minutes.map((minute) => (
                          <Picker.Item
                            key={minute}
                            label={String(minute).padStart(2, '0')}
                            value={minute}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowWeb(false)} style={styles.modalButtonGhost}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={commitWeb} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: theme.fonts.subheading,
    fontSize: 14,
    color: theme.colors.ink,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  buttonLabel: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  buttonValue: {
    marginTop: 6,
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 14,
  },
  valueHint: {
    fontFamily: theme.fonts.body,
    color: theme.colors.slate,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,36,66,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  modalTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 16,
  },
  modalSections: {
    gap: 14,
  },
  modalSection: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accentDark,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerShell: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
    height: 120,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  modalButtonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  modalButtonText: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 13,
  },
});
