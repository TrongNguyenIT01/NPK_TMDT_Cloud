FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY . .
WORKDIR "/src/TMDT_FINAL_NPKL"
RUN dotnet publish "TMDT_FINAL_NPKL.csproj" -c Release -o /app/publish /p:UseAppHost=false \
    && rm -rf /root/.nuget /root/.local

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /src/TMDT_FINAL_NPKL/FrontEnd ./FrontEnd

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 80
ENTRYPOINT ["dotnet", "TMDT_FINAL_NPKL.dll"]
