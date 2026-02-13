import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const locale = language === "fr" ? fr : enUS;

  const { data: caseInfo } = trpc.caseInfo.get.useQuery();
  const { data: docStats } = trpc.documents.stats.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: recentDocs } = trpc.documents.list.useQuery();
  const { data: recentEvents } = trpc.timeline.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const stats = [
    {
      title: t("dashboard.stats.total_documents"),
      value: docStats?.total || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("dashboard.stats.total_actors"),
      value: users?.length || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("dashboard.stats.total_events"),
      value: recentEvents?.length || 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("dashboard.stats.case_value"),
      value: caseInfo?.amount
        ? `${(caseInfo.amount / 100).toLocaleString(language === "fr" ? "fr-FR" : "en-US")} ${caseInfo.currency || "EUR"}`
        : "-",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("dashboard.title")}
          </h1>
          {caseInfo && (
            <p className="text-lg text-muted-foreground">
              {language === "fr" ? caseInfo.titleFr : caseInfo.titleEn}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="card-elegant hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t("dashboard.recent_documents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocs && recentDocs.length > 0 ? (
                <div className="space-y-3">
                  {recentDocs.slice(0, 5).map((doc) => {
                    const category = categories?.find((c) => c.id === doc.categoryId);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category && (language === "fr" ? category.nameFr : category.nameEn)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(doc.uploadedAt), "PPp", { locale })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("documents.no_documents")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Timeline */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t("dashboard.timeline_preview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents && recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="timeline-item last:border-l-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-foreground">
                          {language === "fr" ? event.titleFr : event.titleEn}
                        </p>
                        {(event.descriptionFr || event.descriptionEn) && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {language === "fr" ? event.descriptionFr : event.descriptionEn}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.eventDate), "PPp", { locale })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("timeline.no_events")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents by Category */}
        {docStats && docStats.byCategory.length > 0 && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t("dashboard.documents_by_category")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docStats.byCategory.map((stat) => {
                  const category = categories?.find((c) => c.id === stat.categoryId);
                  if (!category) return null;
                  return (
                    <div
                      key={stat.categoryId}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <FileText className="w-6 h-6" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {language === "fr" ? category.nameFr : category.nameEn}
                        </p>
                        <p className="text-lg font-bold text-foreground">{stat.count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
