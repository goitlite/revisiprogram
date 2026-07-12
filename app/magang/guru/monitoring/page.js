"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  saveMonitoring,
  uploadPhoto,
} from "../../lib/api";

import {
  getSession,
  isLoggedIn,
} from "../../lib/auth";

export default function MonitoringPage() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  const [status, setStatus] = useState("BERSAMA SISWA");
  const [keterangan, setKeterangan] = useState("");

  const [photo, setPhoto] = useState("");

  const [cameraReady, setCameraReady] = useState(false);

  const [latitude, setLatitude] = useState("-");
  const [longitude, setLongitude] = useState("-");
  const [accuracy, setAccuracy] = useState("-");

  const [gpsLoading, setGpsLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // FUNGSI KAMERA
  async function startCamera() {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode: "environment",

          width: {
            ideal: 1280,
          },

          height: {
            ideal: 720,
          },

        },

        audio: false,

      });

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = async () => {

        await videoRef.current.play();

        setCameraReady(true);

      };

    } catch (err) {

      console.log(err);

      alert("Kamera tidak dapat dibuka.");

    }

  }

  // FUNGSI AMBIL FOTO
  async function capturePhoto() {

    if (photo) {

      setPhoto("");

      setLatitude("-");

      setLongitude("-");

      setAccuracy("-");

      await startCamera();

      return;

    }

    const video = videoRef.current;

    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (video.readyState !== 4) {

      alert("Kamera belum siap.");

      return;

    }

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg", 0.9);

    setPhoto(image);

    const tracks = video.srcObject?.getTracks();

    tracks?.forEach(track => track.stop());

    video.srcObject = null;

    getLocation();

  }

  // FUNGSI GPS
  function getLocation() {

    if (!navigator.geolocation) {

      alert("GPS tidak didukung.");

      return;

    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        setLatitude(pos.coords.latitude);

        setLongitude(pos.coords.longitude);

        setAccuracy(Math.round(pos.coords.accuracy) + " meter");

        setGpsLoading(false);

      },

      () => {

        setGpsLoading(false);

        alert("Lokasi tidak dapat diperoleh.");

      },

      {

        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 0,

      }

    );

  }

  // FUNGSI SIMPAN MONITORING
  async function handleSaveMonitoring() {

    if (!photo) {
      alert("Silakan ambil foto monitoring.");
      return;
    }

    if (latitude === "-") {
      alert("Lokasi GPS belum diperoleh.");
      return;
    }

    if (keterangan.trim() === "") {
      alert("Keterangan monitoring wajib diisi.");
      return;
    }

    try {

      setSaving(true);

      // Upload foto ke Google Drive
      const upload = await uploadPhoto(
        photo,
        "MONITORING_" +
        Date.now() +
        ".jpg"
      );

      if (!upload.success) {

        alert(upload.message);

        setSaving(false);

        return;

      }

      // Simpan monitoring
      const result = await saveMonitoring({

        idGuru: user.id,

        namaGuru: user.nama,

        fotoUrl: upload.url,

        latitude: latitude,

        longitude: longitude,

        mapUrl:
          "https://www.google.com/maps?q=" +
          latitude +
          "," +
          longitude,

        status: status,

        keterangan: keterangan,

      });

      if (result.success) {

        alert("Monitoring berhasil disimpan.");

        router.replace("/magang/guru");

      } else {

        alert(result.message);

      }

    } catch (err) {

      console.log(err);

      alert("Terjadi kesalahan.");

    }

    setSaving(false);

  }

  // LOGIN GURU
  useEffect(() => {

    async function init() {

      if (!isLoggedIn()) {

        router.replace("/magang/login");

        return;

      }

      const session = getSession();

      if (!session || session.role !== "guru") {

        router.replace("/magang/login");

        return;

      }

      setUser(session);

      setLoading(false);

    }

    init();

  }, []);

  // JALANKAN KAMERA
  useEffect(() => {

    if (!loading && user && !photo) {

      startCamera();

    }

    return () => {

      if (videoRef.current?.srcObject) {

        videoRef.current.srcObject

          .getTracks()

          .forEach(track => track.stop());

      }

    };

  }, [loading, user, photo]);

  // LOADING STATE
  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-700"></div>

          <p className="mt-4 text-slate-500">
            Memuat Monitoring...
          </p>
        </div>
      </main>
    );
  }

  return (

    <main className="min-h-screen bg-slate-100 pb-10">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <Image
              src="/logo.png"
              alt="Logo"
              width={45}
              height={45}
            />

            <div>

              <h1 className="font-black text-slate-800">
                MONITORING MAGANG
              </h1>

              <p className="text-xs text-slate-500">
                SMKN 1 TELUK KUANTAN
              </p>

            </div>

          </div>

          <button
            onClick={() => router.back()}
            className="rounded-xl bg-blue-700 px-5 py-2 font-bold text-white hover:bg-blue-800"
          >

            Kembali

          </button>

        </div>

      </header>

      {/* HERO */}
      <div className="mx-auto max-w-5xl p-6">

        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-8 text-white shadow-xl">

          <p className="text-sm uppercase tracking-widest text-amber-300">

            Monitoring Lapangan

          </p>

          <h2 className="mt-3 text-4xl font-black">

            {user.nama}

          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <Info
              label="ID GURU"
              value={user.id}
            />

            <Info
              label="NAMA GURU"
              value={user.nama}
            />

          </div>

        </div>

        {/* KAMERA */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow">

          <h2 className="text-2xl font-black text-slate-800">

            Foto Monitoring

          </h2>

          <div className="mt-6">

            {

              !photo ?

                (

                  <video

                    ref={videoRef}

                    autoPlay

                    playsInline

                    muted

                    className="h-80 w-full rounded-3xl bg-black object-cover"

                  />

                )

                :

                (

                  <img

                    src={photo}

                    alt="Monitoring"

                    className="h-80 w-full rounded-3xl object-cover"

                  />

                )

            }

            <canvas
              ref={canvasRef}
              className="hidden"
            />

          </div>

          <button

            onClick={capturePhoto}

            disabled={!cameraReady && !photo}

            className={`mt-6 w-full rounded-2xl py-4 text-lg font-bold text-white

            ${

              photo

                ?

                "bg-amber-500"

                :

                "bg-blue-700"

            }

            `}

          >

            {

              photo

                ?

                "Ambil Ulang"

                :

                "Ambil Foto"

            }

          </button>

        </section>

        {/* GPS */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow">

          <h2 className="text-2xl font-black text-slate-800">

            Lokasi Monitoring

          </h2>

          <div className="mt-6 space-y-4">

            <GpsInfo
              label="Latitude"
              value={latitude}
            />

            <GpsInfo
              label="Longitude"
              value={longitude}
            />

            <GpsInfo

              label="Akurasi"

              value={

                gpsLoading

                  ?

                  "Mendapatkan Lokasi..."

                  :

                  accuracy

              }

            />

          </div>

        </section>

        {/* FORM */}
        <section className="mt-8 rounded-3xl bg-white p-8 shadow">

          <h2 className="text-2xl font-black text-slate-800">

            Data Monitoring

          </h2>

          {/* STATUS */}
          <div className="mt-8">

            <label className="font-bold text-slate-700">

              Status Monitoring

            </label>

            <div className="mt-4 space-y-3">

              {

                [

                  "BERSAMA SISWA",

                  "SISWA MAGANG DILUAR",

                ].map(item => (

                  <label

                    key={item}

                    className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer

                    ${

                      status === item

                        ?

                        "border-blue-500 bg-blue-50"

                        :

                        ""

                    }

                    `}

                  >

                    <input

                      type="radio"

                      checked={status === item}

                      onChange={() => setStatus(item)}

                    />

                    <span>

                      {item}

                    </span>

                  </label>

                ))

              }

            </div>

          </div>

          {/* KETERANGAN */}
          <div className="mt-6">

            <label className="font-bold text-slate-700">

              Keterangan

            </label>

            <textarea

              rows={5}

              value={keterangan}

              onChange={(e) => setKeterangan(e.target.value)}

              placeholder="Tuliskan kegiatan monitoring"

              className="mt-2 w-full rounded-xl border p-4"

            />

          </div>

          {/* TOMBOL */}
          <button

            onClick={handleSaveMonitoring}

            disabled={saving || !photo || latitude === "-"}

            className="mt-8 w-full rounded-2xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700 disabled:bg-slate-400"

          >

            {

              saving

                ?

                "MENYIMPAN..."

                :

                "SIMPAN MONITORING"

            }

          </button>

        </section>

      </div>

    </main>
  );
}

// KOMPONEN INFO
function Info({ label, value }) {

  return (

    <div className="rounded-xl bg-white/10 p-4">

      <p className="text-xs uppercase tracking-wider text-blue-200">

        {label}

      </p>

      <p className="mt-1 text-lg font-bold text-white">

        {value}

      </p>

    </div>

  );

}

// KOMPONEN GPS INFO
function GpsInfo({ label, value }) {

  return (

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">

        {label}

      </p>

      <p className="mt-1 text-lg font-bold text-slate-800">

        {value}

      </p>

    </div>

  );

}