const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const options = b.addOptions();
    options.addOption(bool, "enable_windows", true);
    options.addOption(bool, "enable_macos", true);
    options.addOption(bool, "enable_linux", true);

    const library = b.addStaticLibrary(.{
        .name = "creature_native",
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    library.root_module.addOptions("build_options", options);
    b.installArtifact(library);

    // FFI consumers need a loadable artifact; keep the static library above for embedders.
    const shared_library = b.addSharedLibrary(.{
        .name = "creature_native",
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    shared_library.root_module.addOptions("build_options", options);
    b.installArtifact(shared_library);

    const tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    tests.root_module.addOptions("build_options", options);
    const run_tests = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run native credential-store tests");
    test_step.dependOn(&run_tests.step);
}
