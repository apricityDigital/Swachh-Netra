import React from 'react';
import { Menu, TextInput, HelperText } from 'react-native-paper';
import { UserRole, ROLE_OPTIONS } from '../../types/user';

interface RoleSelectorProps {
  value: UserRole | '';
  onValueChange: (role: UserRole) => void;
  error?: string;
  style?: any;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onValueChange,
  error,
  style,
}) => {
  const [visible, setVisible] = React.useState(false);

  const selectedRole = ROLE_OPTIONS.find(r => r.value === value);

  return (
    <>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TextInput
            label="Select Role in Swach Netra"
            value={selectedRole?.label || ''}
            mode="outlined"
            style={style}
            editable={false}
            right={
              <TextInput.Icon
                icon="chevron-down"
                onPress={() => setVisible(true)}
              />
            }
            onPress={() => setVisible(true)}
            error={!!error}
          />
        }
      >
        {ROLE_OPTIONS.map((role) => (
          <Menu.Item
            key={role.value}
            onPress={() => {
              onValueChange(role.value);
              setVisible(false);
            }}
            title={role.label}
          />
        ))}
      </Menu>
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </>
  );
};

export default RoleSelector;
