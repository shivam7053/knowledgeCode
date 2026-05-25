// Normalize BASE by removing any trailing slashes to prevent double-slashes in URLs
export const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API = `${BASE}/tests`;

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" }, ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      let msg = err.detail || `Request failed with status ${res.status}`;
      if (typeof msg === "object") {
        // Format FastAPI validation errors (list of objects) into a readable string
        msg = Array.isArray(msg) 
          ? msg.map((m: any) => `${m.loc.join(".")}: ${m.msg}`).join(", ") 
          : JSON.stringify(msg);
      }
      throw new Error(msg);
    }
    return res.json();
  } catch (error: any) {
    console.error(`API Fetch Error [${url}]:`, error.message);
    throw error;
  }
}

export interface Subject { id: string; name: string; icon: string; color: string; test_count: number; }
export interface Test { id: string; subject_id: string; title: string; duration: number; description: string; question_count: number; }
export interface Question { id: string; test_id: string; text: string; options: string[]; }
export interface QuestionAdmin extends Question { correct: number; explanation: string; }
export interface Solution { question_id: string; text: string; options: string[]; your_answer: number | null; correct_answer: number; is_correct: boolean; explanation: string; }
export interface AttemptResult { attempt_id: string; score: number; correct: number; wrong: number; skipped: number; total: number; elapsed_sec: number; solutions: Solution[]; }
export interface AdminStats { subjects: number; tests: number; questions: number; attempts: number; }

export const getSubjects = () => req<Subject[]>("/subjects");
export const createSubject = (d: {name:string;icon:string;color:string}) => req<Subject>("/subjects",{method:"POST",body:JSON.stringify(d)});
export const updateSubject = (id:string,d:{name:string;icon:string;color:string}) => req<Subject>(`/subjects/${id}`,{method:"PUT",body:JSON.stringify(d)});
export const deleteSubject = (id:string) => req<void>(`/subjects/${id}`,{method:"DELETE"});
export const getTestsBySubject = (sid:string) => req<Test[]>(`/subjects/${sid}/tests`);
export const getAllTests = () => req<Test[]>("/tests");
export const createTest = (d:{subject_id:string;title:string;duration:number;description:string}) => req<Test>("/tests",{method:"POST",body:JSON.stringify(d)});
export const updateTest = (id:string,d:{subject_id:string;title:string;duration:number;description:string}) => req<Test>(`/tests/${id}`,{method:"PUT",body:JSON.stringify(d)});
export const deleteTest = (id:string) => req<void>(`/tests/${id}`,{method:"DELETE"});
export const getQuestionsStudent = (tid:string) => req<Question[]>(`/tests/${tid}/questions`);
export const getAllQuestionsAdmin = (tid?:string) => req<QuestionAdmin[]>(`/admin/questions${tid?`?test_id=${tid}`:""}`);
export const createQuestion = (d:{test_id:string;text:string;options:string[];correct:number;explanation:string}) => req<QuestionAdmin>("/admin/questions",{method:"POST",body:JSON.stringify(d)});
export const updateQuestion = (id:string,d:{test_id:string;text:string;options:string[];correct:number;explanation:string}) => req<QuestionAdmin>(`/admin/questions/${id}`,{method:"PUT",body:JSON.stringify(d)});
export const deleteQuestion = (id:string) => req<void>(`/admin/questions/${id}`,{method:"DELETE"});
export const submitTest = (testId:string,answers:Record<string,number>,elapsed_sec:number) => req<AttemptResult>(`/tests/${testId}/submit`,{method:"POST",body:JSON.stringify({test_id:testId,answers,elapsed_sec})});
export const parseDocument = (test_id:string,content:string) => req<{imported:number;questions:QuestionAdmin[]}>("/admin/parse-document",{method:"POST",body:JSON.stringify({test_id,content})});
export const parseDocumentUpload = async (test_id:string,file:File) => {
  const fd = new FormData(); fd.append("file",file);
  const res = await fetch(`${API}/admin/parse-document/upload?test_id=${test_id}`,{method:"POST",body:fd});
  if(!res.ok) throw new Error((await res.json()).detail||"Upload failed");
  return res.json();
};
export const getAdminStats = () => req<AdminStats>("/admin/stats");