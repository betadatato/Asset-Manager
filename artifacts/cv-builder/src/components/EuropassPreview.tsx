import React, { useRef, useEffect, useState } from "react";
import { Cv } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";

interface EuropassPreviewProps {
  cv: Cv;
  live?: boolean; // If true, adds shadow/borders suitable for editor embedding
}

export function EuropassPreview({ cv, live = true }: EuropassPreviewProps) {
  // Compute secondary background (tint of main color)
  const sidebarStyle = {
    backgroundColor: cv.mainColor,
    opacity: 0.15,
  };

  const getCEFRLevel = (level?: string | null) => {
    return level || "-";
  };

  return (
    <div className={`bg-white min-h-[1056px] text-[13px] relative mx-auto w-full font-sans text-slate-800 ${live ? 'shadow-xl shadow-black/5 ring-1 ring-border rounded-sm overflow-hidden' : ''} print:shadow-none print:ring-0`}>
      {/* Decorative Graphics (Optional) */}
      {cv.useGraphics && (
        <div 
          className="absolute top-0 right-0 w-3/4 h-1 print:h-2" 
          style={{ backgroundColor: cv.mainColor }} 
        />
      )}

      <div className="flex min-h-[1056px]">
        {/* Left Sidebar */}
        <div className="w-[32%] relative overflow-hidden shrink-0">
          <div className="absolute inset-0 z-0" style={sidebarStyle} />
          
          <div className="relative z-10 p-8 flex flex-col items-center text-center h-full">
            {cv.photoUrl ? (
              <div className="w-32 h-40 mb-6 rounded-sm overflow-hidden border-2 border-white shadow-sm shrink-0 bg-white">
                <img src={cv.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-40 mb-6 rounded-sm border-2 border-dashed border-black/20 flex flex-col items-center justify-center shrink-0 bg-black/5">
                <span className="text-black/40 text-xs">35x45mm</span>
              </div>
            )}
            
            <div className="w-full text-left space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 border-b pb-2 mb-4" style={{ borderColor: `${cv.mainColor}40` }}>
                CONTACT
              </h2>

              {cv.address && (
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">Address</div>
                  <div className="text-slate-700 leading-snug">{cv.address}</div>
                </div>
              )}

              {cv.phone && (
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">Phone</div>
                  <div className="text-slate-700">{cv.phone}</div>
                </div>
              )}

              {cv.email && (
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">Email</div>
                  <div className="text-slate-700 break-words">{cv.email}</div>
                </div>
              )}

              {cv.linkedin && (
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">LinkedIn</div>
                  <div className="text-slate-700 break-words">{cv.linkedin}</div>
                </div>
              )}

              {(cv.dateOfBirth || cv.nationality || cv.gender) && (
                <div className="pt-4 space-y-3">
                  {cv.dateOfBirth && (
                    <div>
                      <div className="font-semibold text-slate-900 mb-0.5">Date of birth</div>
                      <div className="text-slate-700">{cv.dateOfBirth}</div>
                    </div>
                  )}
                  {cv.nationality && (
                    <div>
                      <div className="font-semibold text-slate-900 mb-0.5">Nationality</div>
                      <div className="text-slate-700">{cv.nationality}</div>
                    </div>
                  )}
                  {cv.gender && (
                    <div>
                      <div className="font-semibold text-slate-900 mb-0.5">Gender</div>
                      <div className="text-slate-700">{cv.gender}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Other Side details */}
              {cv.drivingLicense && (
                <div className="pt-4">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 border-b pb-2 mb-3" style={{ borderColor: `${cv.mainColor}40` }}>
                    DRIVING LICENCE
                  </h2>
                  <div className="text-slate-700">{cv.drivingLicense}</div>
                </div>
              )}

              {cv.hobbies && (
                <div className="pt-4">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 border-b pb-2 mb-3" style={{ borderColor: `${cv.mainColor}40` }}>
                    HOBBIES
                  </h2>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{cv.hobbies}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-[68%] p-8 pt-10 text-left shrink-0">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-slate-900 mb-4 tracking-tight" style={{ color: cv.mainColor }}>
              {cv.fullName || "Your Name"}
            </h1>
            
            {cv.summary && (
              <div className="text-slate-700 leading-relaxed text-[13.5px] whitespace-pre-wrap">
                {cv.summary}
              </div>
            )}
          </div>

          {cv.experiences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b-2 pb-1" style={{ color: cv.mainColor, borderBottomColor: cv.mainColor }}>
                Work Experience
              </h2>
              <div className="space-y-5">
                {cv.experiences.map((exp) => (
                  <div key={exp.id} className="relative">
                    <div className="flex mb-1 gap-4">
                      <div className="w-1/4 shrink-0 font-medium text-slate-600">
                        {formatDate(exp.startDate)} – {exp.endDate ? formatDate(exp.endDate) : "Ongoing"}
                      </div>
                      <div className="w-3/4">
                        <h3 className="font-bold text-slate-900 text-[14px]">{exp.jobTitle}</h3>
                        <div className="font-medium text-slate-700">
                          {exp.employer}{exp.city ? `, ${exp.city}` : ""}
                        </div>
                      </div>
                    </div>
                    {exp.description && (
                      <div className="flex gap-4">
                        <div className="w-1/4 shrink-0"></div>
                        <div className="w-3/4 text-slate-600 leading-relaxed whitespace-pre-wrap mt-1">
                          {exp.description}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.educations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b-2 pb-1" style={{ color: cv.mainColor, borderBottomColor: cv.mainColor }}>
                Education and Training
              </h2>
              <div className="space-y-5">
                {cv.educations.map((edu) => (
                  <div key={edu.id} className="relative">
                    <div className="flex mb-1 gap-4">
                      <div className="w-1/4 shrink-0 font-medium text-slate-600">
                        {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : "Ongoing"}
                      </div>
                      <div className="w-3/4">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="font-bold text-slate-900 text-[14px] leading-tight">{edu.degree}</h3>
                          {edu.grade && <span className="font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">Grade: {edu.grade}</span>}
                        </div>
                        <div className="font-medium text-slate-700 mt-0.5">
                          {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.languages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b-2 pb-1" style={{ color: cv.mainColor, borderBottomColor: cv.mainColor }}>
                Language Skills
              </h2>
              
              <div className="mt-4 border border-slate-200 rounded-sm overflow-hidden text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="p-2 border-b border-r border-slate-200 w-1/4 font-semibold">Language</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center font-semibold" colSpan={2}>Understanding</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center font-semibold" colSpan={2}>Speaking</th>
                      <th className="p-2 border-b border-slate-200 text-center font-semibold">Writing</th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-600 text-[11px]">
                      <th className="p-1 border-b border-r border-slate-200"></th>
                      <th className="p-1 border-b border-r border-slate-200 text-center font-medium">Listening</th>
                      <th className="p-1 border-b border-r border-slate-200 text-center font-medium">Reading</th>
                      <th className="p-1 border-b border-r border-slate-200 text-center font-medium">Spoken interaction</th>
                      <th className="p-1 border-b border-r border-slate-200 text-center font-medium">Spoken production</th>
                      <th className="p-1 border-b border-slate-200 text-center font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cv.languages.map((lang) => (
                      <tr key={lang.id} className="border-b border-slate-200 last:border-0">
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{lang.languageName}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-semibold" style={{ color: cv.mainColor }}>{getCEFRLevel(lang.listening)}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-semibold" style={{ color: cv.mainColor }}>{getCEFRLevel(lang.reading)}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-semibold" style={{ color: cv.mainColor }}>{getCEFRLevel(lang.spokenInteraction)}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-semibold" style={{ color: cv.mainColor }}>{getCEFRLevel(lang.spokenProduction)}</td>
                        <td className="p-2 text-center font-semibold" style={{ color: cv.mainColor }}>{getCEFRLevel(lang.writing)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">
                Levels: A1 and A2: Basic user - B1 and B2: Independent user - C1 and C2: Proficient user<br />
                Common European Framework of Reference for Languages (CEFR)
              </div>
            </div>
          )}

          {cv.digitalSkills && (
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b-2 pb-1" style={{ color: cv.mainColor, borderBottomColor: cv.mainColor }}>
                Digital Skills
              </h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {cv.digitalSkills}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
