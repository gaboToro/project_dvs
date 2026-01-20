import { useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { clearToken } from '@/lib/auth';
import { theme } from '@/lib/theme';

type ProfileMenuProps = {
  fullName?: string | null;
};

export function ProfileMenu({ fullName }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const avatarRef = useRef<View>(null);

  const initials = useMemo(() => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    return letters.join('') || '?';
  }, [fullName]);

  const openMenu = () => {
    avatarRef.current?.measureInWindow?.((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
    setOpen(true);
  };

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }
    openMenu();
  };

  const handleProfile = () => {
    setOpen(false);
    router.push('/profile');
  };

  const handleLogout = async () => {
    setOpen(false);
    await clearToken();
    router.replace('/login');
  };

  return (
    <View style={styles.wrapper}>
      <View ref={avatarRef} collapsable={false}>
        <Pressable
          onPress={toggleMenu}
          onHoverIn={() => Platform.OS === 'web' && openMenu()}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      {open ? (
        <Modal transparent visible animationType="fade">
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <View style={styles.modalLayer} pointerEvents="box-none">
              <View
                style={[
                  styles.menu,
                  {
                    top: (anchor?.y ?? 60) + (anchor?.height ?? 0) + 8,
                    left: Math.max(12, (anchor?.x ?? 0) + (anchor?.width ?? 0) - 180),
                  },
                ]}
              >
                <Pressable onPress={handleProfile} style={styles.menuItem}>
                  <Text style={styles.menuText}>Ver perfil</Text>
                </Pressable>
                <Pressable onPress={handleLogout} style={styles.menuItem}>
                  <Text style={styles.menuText}>Salir</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  avatarText: {
    fontFamily: theme.fonts.subheading,
    color: theme.colors.ink,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  backdrop: {
    flex: 1,
  },
  modalLayer: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 13,
  },
});
