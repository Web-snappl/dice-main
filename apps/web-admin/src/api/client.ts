import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
    private client: AxiosInstance;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Load tokens from localStorage
        this.accessToken = localStorage.getItem('admin_access_token');
        this.refreshToken = localStorage.getItem('admin_refresh_token');

        // Request interceptor to add auth header
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (this.accessToken && config.headers) {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
                    originalRequest._retry = true;

                    try {
                        const refreshResponse = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
                            refreshToken: this.refreshToken,
                        });

                        this.setTokens(refreshResponse.data.accessToken, this.refreshToken!);
                        originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        this.clearTokens();
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('admin_access_token', accessToken);
        localStorage.setItem('admin_refresh_token', refreshToken);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
    }

    hasTokens(): boolean {
        return !!this.accessToken;
    }

    // Auth endpoints
    async login(email: string, password: string) {
        const response = await this.client.post('/admin/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data;
        this.setTokens(accessToken, refreshToken);
        return user;
    }

    async logout() {
        try {
            await this.client.post('/admin/auth/logout');
        } finally {
            this.clearTokens();
        }
    }

    async getMe() {
        const response = await this.client.get('/admin/auth/me');
        return response.data;
    }

    // Analytics
    async getDashboard() {
        const response = await this.client.get('/admin/analytics/dashboard');
        return response.data;
    }

    // Users
    async getUsers(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/users', { params });
        return response.data;
    }

    async getUser(id: string) {
        const response = await this.client.get(`/admin/users/${id}`);
        return response.data;
    }

    async getUserWithHistory(id: string) {
        const response = await this.client.get(`/admin/users/${id}/history`);
        return response.data;
    }

    async updateUser(id: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/admin/users/${id}`, data);
        return response.data;
    }

    async suspendUser(id: string, reason: string) {
        const response = await this.client.post(`/admin/users/${id}/suspend`, { reason });
        return response.data;
    }

    async banUser(id: string, reason: string) {
        const response = await this.client.post(`/admin/users/${id}/ban`, { reason });
        return response.data;
    }

    async restoreUser(id: string) {
        const response = await this.client.post(`/admin/users/${id}/restore`);
        return response.data;
    }

    async deleteUser(id: string) {
        await this.client.delete(`/admin/users/${id}`);
    }

    // Reports
    async getReports(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/reports', { params });
        return response.data;
    }

    async getReportStats() {
        const response = await this.client.get('/admin/reports/stats');
        return response.data;
    }

    async updateReport(id: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/admin/reports/${id}`, data);
        return response.data;
    }

    // Games
    async getGames(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/games', { params });
        return response.data;
    }

    async createGame(data: Record<string, unknown>) {
        const response = await this.client.post('/admin/games', data);
        return response.data;
    }

    async updateGame(id: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/admin/games/${id}`, data);
        return response.data;
    }

    async activateGame(id: string) {
        const response = await this.client.post(`/admin/games/${id}/activate`);
        return response.data;
    }

    async deactivateGame(id: string) {
        const response = await this.client.post(`/admin/games/${id}/deactivate`);
        return response.data;
    }

    // Game Configs (real backend)
    async getGameConfigs() {
        const response = await this.client.get('/game/configs');
        return response.data;
    }

    async updateGameConfig(gameId: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/game/config/${gameId}`, data);
        return response.data;
    }

    async seedGameConfigs() {
        const response = await this.client.post('/game/config/seed');
        return response.data;
    }

    // Scores
    async getScores(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/scores', { params });
        return response.data;
    }

    async getRankings(params: any = {}) {
        const response = await this.client.get('/admin/scores/rankings', { params });
        return response.data;
    }

    async getSuspiciousScores() {
        const response = await this.client.get('/admin/scores/suspicious');
        return response.data;
    }

    async resetScore(userId: string, reason: string) {
        const response = await this.client.post(`/admin/scores/${userId}/reset`, { reason });
        return response.data;
    }

    // Tournaments
    async getTournaments(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/tournaments', { params });
        return response.data;
    }

    async getUpcomingTournaments() {
        const response = await this.client.get('/admin/tournaments/upcoming');
        return response.data;
    }

    async createTournament(data: Record<string, unknown>) {
        const response = await this.client.post('/admin/tournaments', data);
        return response.data;
    }

    async updateTournament(id: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/admin/tournaments/${id}`, data);
        return response.data;
    }

    async deleteTournament(id: string) {
        await this.client.delete(`/admin/tournaments/${id}`);
    }

    // Rewards
    async getRewards(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/rewards', { params });
        return response.data;
    }

    async getRewardStats() {
        const response = await this.client.get('/admin/rewards/stats');
        return response.data;
    }

    async createReward(data: Record<string, unknown>) {
        const response = await this.client.post('/admin/rewards', data);
        return response.data;
    }

    // Financial (read-only)
    async getTransactions(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/financial/transactions', { params });
        return response.data;
    }

    async getFinancialSummary() {
        const response = await this.client.get('/admin/financial/summary');
        return response.data;
    }

    async getFinancialAnomalies() {
        const response = await this.client.get('/admin/financial/anomalies');
        return response.data;
    }

    // Audit Log
    async getAuditLogs(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/audit-logs', { params });
        return response.data;
    }

    async getAuditLog(id: string) {
        const response = await this.client.get(`/admin/audit-logs/${id}`);
        return response.data;
    }

    // Communication
    async getAnnouncements(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/communication/announcements', { params });
        return response.data;
    }

    async createAnnouncement(data: Record<string, unknown>) {
        const response = await this.client.post('/admin/communication/announcements', data);
        return response.data;
    }

    async updateAnnouncement(id: string, data: Record<string, unknown>) {
        const response = await this.client.patch(`/admin/communication/announcements/${id}`, data);
        return response.data;
    }

    async deleteAnnouncement(id: string) {
        await this.client.delete(`/admin/communication/announcements/${id}`);
    }

    async sendNotification(data: { title: string; message: string; userId?: string }) {
        const response = await this.client.post('/admin/communication/notifications/send', data);
        return response.data;
    }

    // Support
    async getTickets(params?: Record<string, unknown>) {
        const response = await this.client.get('/admin/support/tickets', { params });
        return response.data;
    }

    async getTicketStats() {
        const response = await this.client.get('/admin/support/stats');
        return response.data;
    }

    async getTicket(id: string) {
        const response = await this.client.get(`/admin/support/tickets/${id}`);
        return response.data;
    }

    async replyToTicket(id: string, message: string) {
        const response = await this.client.post(`/admin/support/tickets/${id}/reply`, { message });
        return response.data;
    }

    async updateTicketStatus(id: string, status: string) {
        const response = await this.client.patch(`/admin/support/tickets/${id}/status`, { status });
        return response.data;
    }

    async assignTicket(id: string, adminId: string) {
        const response = await this.client.patch(`/admin/support/tickets/${id}/assign`, { adminId });
        return response.data;
    }

    // Game Issues
    async getGameIssues(gameId: string) {
        const response = await this.client.get(`/admin/games/${gameId}/issues`);
        return response.data;
    }

    async createGameIssue(gameId: string, data: any) {
        const response = await this.client.post(`/admin/games/${gameId}/issues`, data);
        return response.data;
    }

    async updateGameIssue(id: string, data: any) {
        const response = await this.client.patch(`/admin/games/issues/${id}`, data);
        return response.data;
    }
}

export const api = new ApiClient();
