import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export interface FilterOptions {
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  ageRange?: 'kitten' | 'young' | 'adult' | 'senior';
  breed?: string;
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterOptions;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onClear: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onClear,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterOptions>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const renderFilterSection = (
    title: string,
    options: Array<{ label: string; value: any; key: keyof FilterOptions }>
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = localFilters[option.key] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => {
                setLocalFilters((prev) => ({
                  ...prev,
                  [option.key]: isSelected ? undefined : option.value,
                }));
              }}
            >
              <Text
                style={[styles.optionText, isSelected && styles.optionTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>フィルター</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearButton}>クリア</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <ScrollView style={styles.scrollView}>
            {renderFilterSection('性別', [
              { label: 'オス', value: 'male', key: 'gender' },
              { label: 'メス', value: 'female', key: 'gender' },
            ])}

            {renderFilterSection('サイズ', [
              { label: '小型', value: 'small', key: 'size' },
              { label: '中型', value: 'medium', key: 'size' },
              { label: '大型', value: 'large', key: 'size' },
            ])}

            {renderFilterSection('年齢', [
              { label: '子猫 (0-1歳)', value: 'kitten', key: 'ageRange' },
              { label: '若猫 (1-3歳)', value: 'young', key: 'ageRange' },
              { label: '成猫 (3-7歳)', value: 'adult', key: 'ageRange' },
              { label: 'シニア (7歳以上)', value: 'senior', key: 'ageRange' },
            ])}

            {/* TODO: Add breed filter with search */}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>適用する</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    fontSize: 16,
    color: '#2196F3',
    width: 60,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterModal;
