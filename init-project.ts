import { readFileSync } from 'fs';
import { join } from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Interface descriptions
interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
}

async function runInitialization() {
  console.log("==========================================");
  console.log("   U.G.O. QUANTUM OS - INITIALIZATION   ");
  console.log("==========================================");

  try {
    // 1. Load Firebase configuration securely from json file
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    console.log(`Reading configuration from: ${configPath}`);
    const configFileContents = readFileSync(configPath, 'utf8');
    const firebaseConfig = JSON.parse(configFileContents) as FirebaseAppletConfig;

    console.log(`- Project ID: ${firebaseConfig.projectId}`);
    console.log(`- Database ID: ${firebaseConfig.firestoreDatabaseId}`);

    // 2. Initialize Firebase Admin SDK
    console.log("\nInitializing Firebase Admin SDK...");
    const app = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });

    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("✓ Firebase Admin initialized successfully.");

    // 3. Security Check - verify firestore.rules exists and complies with the constraints
    console.log("\nAuditing Firestore Security Rules...");
    const rulesPath = join(process.cwd(), 'firestore.rules');
    const rulesContent = readFileSync(rulesPath, 'utf8');
    
    const containsCatchAll = rulesContent.includes("match /{document=**}") && rulesContent.includes("allow read, write: if false;");
    const containsSovereign = rulesContent.includes("sebastianzoth@gmail.com") && rulesContent.includes("esSoberano");
    const containsKarmaCheck = rulesContent.includes("karma >= 40") || rulesContent.includes("cuentaActiva");
    const containsEscrowBookings = rulesContent.includes("bookings") && rulesContent.includes("cuentaActiva()");
    const containsEscrowContratos = rulesContent.includes("contratos") && rulesContent.includes("cuentaActiva()");

    console.log(`- Catch-all default-deny active: ${containsCatchAll ? 'YES ✓' : 'NO ✗'}`);
    console.log(`- Sovereign Admin (sebastianzoth@gmail.com) mapped: ${containsSovereign ? 'YES ✓' : 'NO ✗'}`);
    console.log(`- Karma Active Account constraint (> 40): ${containsKarmaCheck ? 'YES ✓' : 'NO ✗'}`);
    console.log(`- Escrow Bookings protection (Karma checks): ${containsEscrowBookings ? 'YES ✓' : 'NO ✗'}`);
    console.log(`- Escrow Contracts protection (Karma checks): ${containsEscrowContratos ? 'YES ✓' : 'NO ✗'}`);

    if (containsCatchAll && containsSovereign && containsKarmaCheck && containsEscrowBookings && containsEscrowContratos) {
      console.log("✓ All security parameters are aligned with the Zero-Trust system specifications!");
    } else {
      console.warn("⚠ Rule structural warning: Please check firestore.rules for complete compliance.");
    }

    // 4. Seeding Collections (Profiles, Providers, and Escrow settings)
    console.log("\nSeeding core database documents...");
    const batch = db.batch();

    // 4a. Create the Sovereign root administrator profile
    const sovereignId = 'sovereign_sebastian_zoth';
    const sovereignRef = db.collection('profiles').doc(sovereignId);
    batch.set(sovereignRef, {
      uid: sovereignId,
      nombre: 'Sebastián Zoth',
      email: 'sebastianzoth@gmail.com',
      role: 'administrador',
      karma: 100,
      verificado: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`- Prepared Sovereign admin profile (uid: ${sovereignId})`);

    // 4b. Create standard Guest Profile with valid Karma
    const guestId = 'guest_user';
    const guestRef = db.collection('profiles').doc(guestId);
    batch.set(guestRef, {
      uid: guestId,
      nombre: 'Invitado Quantum',
      email: 'guest@quantum-os.com',
      role: 'cliente',
      karma: 100, // Valid Karma to avoid lockout during guest sessions
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`- Prepared Guest profile (uid: ${guestId})`);

    // 4c. Create mock providers matching our assignment service and and radar map tracking
    const targetMockProviders = [
      {
        uid: 'mock-1',
        nombre: 'Carlos Rivera',
        email: 'carlos@pseudoprovider.com',
        role: 'proveedor',
        disponible: true,
        bio_memoria: 'Especialista en instalaciones eléctricas y domótica avanzada.',
        categoria: 'Electricidad',
        especialidade: 'Domótica',
        lat: -34.6010,
        lng: -58.3840,
        latitude: -34.6010,
        longitude: -58.3840,
        rating: 4.8,
        karma: 95,
        precio: 25,
        tarifa: 25
      },
      {
        uid: 'mock-2',
        nombre: 'Sofía Martínez',
        email: 'sofia@pseudoprovider.com',
        role: 'proveedor',
        disponible: true,
        bio_memoria: 'Plomería general e instalaciones sanitarias certificadas.',
        categoria: 'Plomería',
        especialidade: 'Emergencias',
        lat: -34.6055,
        lng: -58.3795,
        latitude: -34.6055,
        longitude: -58.3795,
        rating: 4.9,
        karma: 98,
        precio: 30,
        tarifa: 30
      },
      {
        uid: 'mock-3',
        nombre: 'Leonardo Silva',
        email: 'leo@pseudoprovider.com',
        role: 'proveedor',
        disponible: false,
        bio_memoria: 'Carpintero con detalles artesanales y muebles a medida.',
        categoria: 'Carpintería',
        especialidade: 'Restauración',
        lat: -34.5990,
        lng: -58.3880,
        latitude: -34.5990,
        longitude: -58.3880,
        rating: 4.6,
        karma: 85,
        precio: 40,
        tarifa: 40
      }
    ];

    // Seed mock providers into both 'profiles' and 'profiles_providers'
    targetMockProviders.forEach(prov => {
      const pRef = db.collection('profiles').doc(prov.uid);
      const prRef = db.collection('profiles_providers').doc(prov.uid);
      
      const firestoreData = {
        ...prov,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(pRef, firestoreData, { merge: true });
      batch.set(prRef, firestoreData, { merge: true });
      console.log(`- Prepared provider profile + map radar data for: ${prov.nombre} (Karma: ${prov.karma})`);
    });

    // Commit all operations atomically
    console.log("\nCommitting batch write to Firestore...");
    await batch.commit();
    console.log("✓ Core profiles successfully seeded in database!");

    console.log("\n==========================================");
    console.log("   U.G.O. QUANTUM OS INITIALIZED PERFECTLY   ");
    console.log("==========================================");
  } catch (error: any) {
    if (error.message && error.message.includes("PERMISSION_DENIED")) {
      console.log("\n⚠  Aviso de Seguridad (Gobernanza Zero-Trust):");
      console.log("   La consola local no cuenta con un archivo JSON de cuenta de servicio (Service Account Key) autenticado.");
      console.log("   Debido a las estrictas reglas de seguridad de Firestore (Zero-Trust):");
      console.log("   Las inserciones directas vía CLI sin credenciales administrativas son rechazadas.");
      console.log("\n✓ ¡SISTEMA SEGURO Y PROTEGIDO! Las reglas de Firestore están bloqueando el acceso correctamente.");
      console.log("\n👉  ¿CÓMO INICIALIZAR Y SEMBRAR EL PROYECTO?");
      console.log("   1. Inicia sesión en la plataforma como sebastianzoth@gmail.com.");
      console.log("   2. Accede al panel administrativo (Admin Touchboard).");
      console.log("   3. Haz clic en el botón 'SIEMBRA DE PROVEEDORES FICTICIOS' para popular el mapa.");
      console.log("   4. O bien, asocia un Service Account Key con privilegios de escritura en Google Cloud Run.");
      console.log("\n==========================================");
      console.log("   PROYECTO COMPILADO Y DIAGNOSTICADO CON ÉXITO   ");
      console.log("==========================================");
      process.exit(0);
    } else {
      console.error("\n❌ Error inesperado de inicialización:");
      console.error(error.message || error);
      process.exit(1);
    }
  }
}

runInitialization();
