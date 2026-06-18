"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Scale, Ruler, Camera, Trash2, ImagePlus } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AreaTrend } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { BeforeAfterSlider } from "./before-after-slider";
import { logWeight, deleteWeight, logMeasurement, addProgressPhoto } from "@/server/actions/tracking";

interface WeightEntry { id: string; date: string; weightKg: number }
interface Photo { id: string; url: string; pose: string; date: string }

export function ProgressView({
  weights,
  photos,
  measurements,
  goal,
}: {
  weights: WeightEntry[];
  photos: Photo[];
  measurements: { date: string; chestCm?: number | null; waistCm?: number | null; armsCm?: number | null; thighsCm?: number | null; bodyFatPct?: number | null }[];
  goal: { current: number; target: number; eta: string | null };
}) {
  const chartData = weights.map((w) => ({ date: w.date, weight: w.weightKg }));

  return (
    <Tabs defaultValue="weight">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="weight" className="flex-1 sm:flex-none"><Scale className="h-4 w-4" /> Weight</TabsTrigger>
        <TabsTrigger value="measure" className="flex-1 sm:flex-none"><Ruler className="h-4 w-4" /> Measurements</TabsTrigger>
        <TabsTrigger value="photos" className="flex-1 sm:flex-none"><Camera className="h-4 w-4" /> Photos</TabsTrigger>
      </TabsList>

      {/* WEIGHT */}
      <TabsContent value="weight" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4"><div className="text-sm text-muted-foreground">Current</div><div className="font-display text-2xl font-bold">{goal.current}kg</div></Card>
          <Card className="p-4"><div className="text-sm text-muted-foreground">Target</div><div className="font-display text-2xl font-bold">{goal.target}kg</div></Card>
          <Card className="p-4"><div className="text-sm text-muted-foreground">Est. achievement</div><div className="font-display text-2xl font-bold">{goal.eta ?? "—"}</div></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Weight trend</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <AreaTrend data={chartData} dataKey="weight" color="hsl(190 90% 50%)" unit="kg" height={260} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Log a few entries to see your trend.</div>
            )}
          </CardContent>
        </Card>

        <WeightLogForm />

        {weights.length > 0 && (
          <Card>
            <CardHeader><CardTitle>History</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {[...weights].reverse().slice(0, 12).map((w) => (
                <WeightRow key={w.id} entry={w} />
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* MEASUREMENTS */}
      <TabsContent value="measure" className="space-y-5">
        <MeasurementForm />
        {measurements.length === 0 ? (
          <EmptyState icon={Ruler} title="No measurements yet" description="Track chest, waist, arms and more to see how your body changes." />
        ) : (
          <Card>
            <CardHeader><CardTitle>Recent</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {measurements.slice(0, 8).map((m, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <div className="flex flex-wrap gap-3">
                    {m.chestCm ? <span>Chest {m.chestCm}cm</span> : null}
                    {m.waistCm ? <span>Waist {m.waistCm}cm</span> : null}
                    {m.armsCm ? <span>Arms {m.armsCm}cm</span> : null}
                    {m.thighsCm ? <span>Thighs {m.thighsCm}cm</span> : null}
                    {m.bodyFatPct ? <Badge variant="secondary">{m.bodyFatPct}% BF</Badge> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* PHOTOS */}
      <TabsContent value="photos" className="space-y-5">
        <PhotoUpload />
        {photos.length >= 2 && (
          <Card>
            <CardHeader><CardTitle>Before / After</CardTitle></CardHeader>
            <CardContent>
              <div className="mx-auto max-w-xs">
                <BeforeAfterSlider
                  before={photos[photos.length - 1].url}
                  after={photos[0].url}
                  beforeLabel={new Date(photos[photos.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  afterLabel={new Date(photos[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {photos.length === 0 ? (
          <EmptyState icon={Camera} title="No progress photos" description="Add your first photo to start a visual transformation log." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-xl border">
                <Image src={p.url} alt="Progress" fill unoptimized className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                  {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function WeightLogForm() {
  const [weight, setWeight] = useState("");
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardContent className="flex items-end gap-3 p-4">
        <div className="flex-1 space-y-2">
          <Label>Log today&apos;s weight (kg)</Label>
          <Input type="number" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78.4" />
        </div>
        <Button variant="gradient" disabled={!weight || pending} onClick={() => start(async () => { await logWeight(Number(weight)); setWeight(""); })}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log
        </Button>
      </CardContent>
    </Card>
  );
}

function WeightRow({ entry }: { entry: WeightEntry }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{entry.weightKg} kg</span>
        <button onClick={() => start(() => { void deleteWeight(entry.id); })} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MeasurementForm() {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ chestCm: "", waistCm: "", armsCm: "", thighsCm: "", bodyFatPct: "" });
  const any = Object.values(f).some(Boolean);
  return (
    <Card>
      <CardHeader><CardTitle>Log measurements</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(["chestCm", "waistCm", "armsCm", "thighsCm", "bodyFatPct"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="capitalize">{k.replace("Cm", " (cm)").replace("Pct", " %")}</Label>
              <Input type="number" step="0.1" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <Button
          variant="gradient"
          className="mt-4"
          disabled={!any || pending}
          onClick={() => start(async () => {
            await logMeasurement({
              chestCm: f.chestCm ? Number(f.chestCm) : undefined,
              waistCm: f.waistCm ? Number(f.waistCm) : undefined,
              armsCm: f.armsCm ? Number(f.armsCm) : undefined,
              thighsCm: f.thighsCm ? Number(f.thighsCm) : undefined,
              bodyFatPct: f.bodyFatPct ? Number(f.bodyFatPct) : undefined,
            });
            setF({ chestCm: "", waistCm: "", armsCm: "", thighsCm: "", bodyFatPct: "" });
          })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save measurements
        </Button>
      </CardContent>
    </Card>
  );
}

function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      start(() => { void addProgressPhoto({ url, pose: "front" }); });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient-soft"><ImagePlus className="h-5 w-5 text-primary" /></div>
          <div>
            <div className="font-medium">Add progress photo</div>
            <div className="text-xs text-muted-foreground">Stored locally for your before/after timeline.</div>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <Button variant="gradient" disabled={pending} onClick={() => inputRef.current?.click()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Upload
        </Button>
      </CardContent>
    </Card>
  );
}
