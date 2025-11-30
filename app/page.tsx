// ... (imports igual que antes)

export default function Home() {
  // ... (hooks igual que antes)

  // ... (hook de memoria)
  const { isSaving, handleResetTrip, handleLoadCloudTrip, handleShareTrip, handleSaveToCloud } = useTripPersistence(...);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6">
        
        {/* HEADER LIMPIO */}
        <div className="w-full no-print">
            <AppHeader onLoadTrip={handleLoadCloudTrip} />
        </div>

        {/* ... (Título print-only igual) ... */}

        {/* FORMULARIO CON SUPERPODERES */}
        <TripForm 
            formData={formData} 
            setFormData={setFormData} 
            loading={loading} 
            results={results} 
            onSubmit={handleCalculateWrapper} 
            showWaypoints={showWaypoints} 
            setShowWaypoints={setShowWaypoints}
            // PASAMOS LAS ACCIONES AQUÍ
            auditMode={auditMode} setAuditMode={setAuditMode}
            isSaving={isSaving} onSave={handleSaveToCloud}
            onShare={handleShareTrip} onReset={handleResetTrip}
            currentTripId={currentTripId}
        />

        {/* ... (Resto igual) ... */}
      </div>
    </main>
  );
}