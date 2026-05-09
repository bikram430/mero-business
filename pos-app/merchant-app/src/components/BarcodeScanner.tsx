import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  visible: boolean;
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ visible, onScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleBarcode({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  }

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}>
          <Text style={styles.permText}>Camera permission chahincha barcode scan garna</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permission Dinus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcode}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
        >
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Text style={styles.hint}>
              {scanned ? 'Scan bhayo! ✓' : 'Barcode frame ma rakhnus'}
            </Text>

            {scanned && (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                <Text style={styles.rescanText}>Pheri Scan Garne</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  permText: { fontSize: 16, textAlign: 'center', color: '#374151', marginBottom: 20 },
  permBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, marginBottom: 10 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { padding: 14 },
  cancelText: { color: '#6B7280', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between', alignItems: 'center' },
  topBar: { width: '100%', padding: 20, paddingTop: 50, alignItems: 'flex-end' },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanArea: {
    width: 260, height: 180, position: 'relative',
    borderRadius: 4,
  },
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: '#fff', borderTopWidth: 3, borderLeftWidth: 3, top: 0, left: 0,
  },
  topRight: { left: undefined, right: 0, borderLeftWidth: 0, borderRightWidth: 3 },
  bottomLeft: { top: undefined, bottom: 0, borderTopWidth: 0, borderBottomWidth: 3 },
  bottomRight: { top: undefined, bottom: 0, left: undefined, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  hint: { color: '#fff', fontSize: 16, marginBottom: 32, textAlign: 'center', paddingHorizontal: 24 },
  rescanBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 40 },
  rescanText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
